import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Observable, Subject, of, throwError } from 'rxjs';
import { BoardComponent } from './board.component';
import { BoardService } from '../../core/services/board.service';
import { BoardTask, ProjectBoard } from '../../core/models/board.model';
import { BoardRealtimeEvent, BoardRealtimeService } from '../../core/services/board-realtime.service';

describe('BoardComponent', () => {
  let fixture: ComponentFixture<BoardComponent>;
  let component: BoardComponent;
  let boardService: jasmine.SpyObj<BoardService>;
  let realtimeService: jasmine.SpyObj<BoardRealtimeService>;
  let realtimeEvents: Subject<BoardRealtimeEvent>;
  let messageService: MessageService;
  let initialBoard: ProjectBoard;

  beforeEach(async () => {
    boardService = jasmine.createSpyObj<BoardService>('BoardService', [
      'getBoard', 'createColumn', 'updateColumn', 'deleteColumn', 'reorderColumns',
      'createTask', 'updateTask', 'deleteTask', 'moveTask', 'sortTasksByPriority', 'downloadReport'
    ]);
    realtimeEvents = new Subject<BoardRealtimeEvent>();
    realtimeService = jasmine.createSpyObj<BoardRealtimeService>('BoardRealtimeService', ['joinBoard', 'leaveBoard'], {
      events$: realtimeEvents.asObservable()
    });
    realtimeService.joinBoard.and.returnValue(Promise.resolve());
    realtimeService.leaveBoard.and.returnValue(Promise.resolve());
    initialBoard = createBoard();
    boardService.getBoard.and.returnValue(of(cloneBoard(initialBoard)));
    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [
        { provide: BoardService, useValue: boardService },
        { provide: BoardRealtimeService, useValue: realtimeService },
        MessageService,
        ConfirmationService,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ projectId: 'project-1' }) } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    messageService = TestBed.inject(MessageService);
    spyOn(messageService, 'add');
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('applies a task move optimistically before the server responds', () => {
    const response = new Subject<ProjectBoard>();
    boardService.moveTask.and.returnValue(response.asObservable());
    const source = component.board!.columns[0];
    const destination = component.board!.columns[1];
    const task = source.tasks[0];

    component.onTaskDrop(createDropEvent(source.tasks, destination.tasks, source.id, destination.id, task, 0));

    expect(source.tasks.some(item => item.id === task.id)).toBeFalse();
    expect(destination.tasks[0].id).toBe(task.id);
    expect(boardService.moveTask).toHaveBeenCalledWith('project-1', task.id, { columnId: destination.id, targetIndex: 0 });
  });

  it('restores the task snapshot when a move fails', () => {
    boardService.moveTask.and.returnValue(throwError(() => new Error('move failed')));
    const source = component.board!.columns[0];
    const destination = component.board!.columns[1];
    const task = source.tasks[0];

    component.onTaskDrop(createDropEvent(source.tasks, destination.tasks, source.id, destination.id, task, 0));

    const restored = component.board!;
    expect(restored.columns[0].tasks[0].id).toBe(task.id);
    expect(restored.columns[1].tasks.some(item => item.id === task.id)).toBeFalse();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn' }));
  });

  it('sorts only the selected column and keeps the other columns unchanged', () => {
    boardService.sortTasksByPriority.and.returnValue(of(component.board!.columns[0].tasks));
    const selected = component.board!.columns[0];
    const untouched = component.board!.columns[1];
    const untouchedSnapshot = untouched.tasks.map(task => task.id);

    selected.tasks = [selected.tasks[0], selected.tasks[1]];
    selected.tasks[0].priority = 'Low';
    selected.tasks[1].priority = 'Urgent';
    component.sortByPriority(selected);

    expect(selected.tasks.map(task => task.priority)).toEqual(['Urgent', 'Low']);
    expect(untouched.tasks.map(task => task.id)).toEqual(untouchedSnapshot);
    expect(boardService.sortTasksByPriority).toHaveBeenCalledWith('project-1', selected.id);
  });

  it('restores the selected column when priority sorting fails', () => {
    boardService.sortTasksByPriority.and.returnValue(throwError(() => new Error('sort failed')));
    const selected = component.board!.columns[0];
    const originalIds = selected.tasks.map(task => task.id);

    selected.tasks[0].priority = 'Low';
    selected.tasks[1].priority = 'Urgent';
    component.sortByPriority(selected);

    expect(selected.tasks.map(task => task.id)).toEqual(originalIds);
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn' }));
  });

  it('applies TaskMoved and TasksReordered events only to the open project', () => {
    const selected = component.board!.columns[0];
    const firstTask = selected.tasks[0];
    const secondTask = selected.tasks[1];

    realtimeEvents.next({
      projectId: 'other-project', resourceId: selected.id, eventType: 'TasksReordered', timestamp: '',
      state: { columnId: selected.id, tasks: [{ taskId: secondTask.id, position: 1024 }, { taskId: firstTask.id, position: 2048 }] }
    });
    expect(selected.tasks.map(task => task.id)).toEqual(['task-1', 'task-2']);

    realtimeEvents.next({
      projectId: 'project-1', resourceId: 'task-1', eventType: 'TasksReordered', timestamp: '',
      state: { columnId: selected.id, tasks: [{ taskId: secondTask.id, position: 1024 }, { taskId: firstTask.id, position: 2048 }] }
    });
    expect(component.board!.columns[0].tasks.map(task => task.id)).toEqual(['task-2', 'task-1']);

    const canonical = cloneBoard(component.board!);
    canonical.columns[1].tasks = [canonical.columns[0].tasks[0]];
    canonical.columns[0].tasks = [canonical.columns[0].tasks[1]];
    canonical.columns[0].tasks[0].columnId = 'column-1';
    canonical.columns[1].tasks[0].columnId = 'column-2';
    realtimeEvents.next({ projectId: 'project-1', resourceId: 'task-1', eventType: 'TaskMoved', timestamp: '', state: canonical });

    expect(component.board!.columns[1].tasks[0].id).toBe('task-2');
  });

  it('downloads a Blob using the server filename and releases the object URL', () => {
    boardService.downloadReport.and.returnValue(of(new HttpResponse({
      body: new Blob(['pdf'], { type: 'application/pdf' }),
      headers: new HttpHeaders({ 'content-disposition': 'attachment; filename="project.pdf"' })
    })));
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    const revokeUrl = spyOn(URL, 'revokeObjectURL');
    const click = spyOn(HTMLAnchorElement.prototype, 'click');
    jasmine.clock().install();

    try {
      component.downloadReport('pdf');
      jasmine.clock().tick(0);

      expect(boardService.downloadReport).toHaveBeenCalledWith('project-1', 'pdf');
      expect(createUrl).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(component.downloadingReport).toBeNull();
      expect(revokeUrl).toHaveBeenCalledWith('blob:test');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('leaves the board and cleans the realtime subscription on destroy', () => {
    fixture.destroy();

    expect(realtimeService.leaveBoard).toHaveBeenCalled();
  });
});

function createDropEvent(
  sourceTasks: BoardTask[],
  destinationTasks: BoardTask[],
  sourceId: string,
  destinationId: string,
  task: BoardTask,
  currentIndex: number
): CdkDragDrop<BoardTask[]> {
  const source = { id: `column-drop-${sourceId}`, data: sourceTasks };
  const destination = { id: `column-drop-${destinationId}`, data: destinationTasks };
  return {
    previousContainer: source,
    container: destination,
    previousIndex: 0,
    currentIndex,
    item: { data: task }
  } as unknown as CdkDragDrop<BoardTask[]>;
}

function createBoard(): ProjectBoard {
  return {
    id: 'project-1',
    name: 'Demo project',
    description: '',
    startDate: '2026-08-01T00:00:00Z',
    expectedEndDate: '2026-08-30T00:00:00Z',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    columns: [
      {
        id: 'column-1', name: 'Backlog', position: 1024, projectId: 'project-1', createdAt: '', tasks: [
          createTask('task-1', 'First task', 'High', 'column-1', 1024),
          createTask('task-2', 'Second task', 'Low', 'column-1', 2048)
        ]
      },
      {
        id: 'column-2', name: 'Done', position: 2048, projectId: 'project-1', createdAt: '', tasks: [
          createTask('task-3', 'Finished task', 'Medium', 'column-2', 1024)
        ]
      }
    ]
  };
}

function createTask(id: string, title: string, priority: BoardTask['priority'], columnId: string, position: number): BoardTask {
  return {
    id, title, description: '', priority, responsibleUserId: null, responsibleUser: null,
    columnId, position, createdAt: '', updatedAt: ''
  };
}

function cloneBoard(board: ProjectBoard): ProjectBoard {
  return JSON.parse(JSON.stringify(board)) as ProjectBoard;
}
