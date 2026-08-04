import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BoardColumnComponent } from './components/board-column/board-column.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { BoardColumn, BoardTask, ColumnSummary, CreateTaskRequest, ProjectBoard, ResponsibleUser, TaskMoveRequest, UpdateTaskRequest } from '../../core/models/board.model';
import { BoardService } from '../../core/services/board.service';
import { BoardRealtimeEvent, BoardRealtimeService } from '../../core/services/board-realtime.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule, ButtonModule, ConfirmDialogModule, DialogModule, InputTextModule, ToastModule, BoardColumnComponent, TaskFormComponent],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="board-page" *ngIf="board as currentBoard">
      <div class="board-heading">
        <div>
          <button class="back-link" type="button" (click)="goBack()"><i class="pi pi-arrow-left"></i> Proyectos</button>
          <span class="kicker">PROJECT BOARD</span>
          <h1>{{ currentBoard.name }}</h1>
          <p>{{ currentBoard.description || 'Organiza el trabajo y mueve las tareas a través del flujo.' }}</p>
        </div>
        <div class="heading-actions">
          <button pButton label="PDF" icon="pi pi-file-pdf" [outlined]="true" [loading]="downloadingReport === 'pdf'" (click)="downloadReport('pdf')"></button>
          <button pButton label="Excel" icon="pi pi-file-excel" [outlined]="true" [loading]="downloadingReport === 'excel'" (click)="downloadReport('excel')"></button>
          <button pButton label="Nueva columna" icon="pi pi-plus" [outlined]="true" (click)="openCreateColumn()"></button>
        </div>
      </div>

      <div class="board-toolbar">
        <span>{{ currentBoard.columns.length }} columnas · {{ totalTasks(currentBoard) }} tareas</span>
        <span class="hint"><i class="pi pi-arrows-alt"></i> Arrastra para cambiar el orden</span>
      </div>

      <div
        class="board-grid"
        cdkDropList
        cdkDropListOrientation="horizontal"
        [cdkDropListData]="currentBoard.columns"
        (cdkDropListDropped)="onColumnDrop($event)">
        <div class="column-drag" *ngFor="let column of currentBoard.columns; trackBy: trackColumn" cdkDrag>
          <app-board-column
            [column]="column"
            [dropListId]="dropListId(column)"
            [connectedDropListIds]="dropListIds(currentBoard)"
            (taskDropped)="onTaskDrop($event)"
            (addTask)="openCreateTask($event)"
            (edit)="openEditColumn($event)"
            (remove)="confirmDeleteColumn($event)"
            (sort)="sortByPriority($event)"
            (taskEdit)="openEditTask($event)"
            (taskRemove)="confirmDeleteTask($event)" />
        </div>
        <div class="empty-board" *ngIf="currentBoard.columns.length === 0">
          <i class="pi pi-columns"></i>
          <strong>Tu tablero está vacío</strong>
          <span>Crea la primera columna para empezar a organizar el trabajo.</span>
          <button pButton label="Crear columna" icon="pi pi-plus" (click)="openCreateColumn()"></button>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="loading"><i class="pi pi-spin pi-spinner"></i> Cargando tablero…</div>

    <p-dialog
      [visible]="columnDialogVisible"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(28rem, 95vw)' }"
      [header]="editingColumn ? 'Editar columna' : 'Nueva columna'"
      (visibleChange)="columnDialogVisible = $event">
      <form class="column-form" [formGroup]="columnForm" (ngSubmit)="saveColumn()">
        <label for="column-name">Nombre</label>
        <input id="column-name" pInputText formControlName="name" maxlength="120" autofocus />
        <small *ngIf="columnForm.controls.name.invalid && columnForm.controls.name.touched">El nombre es obligatorio.</small>
        <div class="form-actions">
          <button pButton type="button" label="Cancelar" severity="secondary" [text]="true" (click)="columnDialogVisible = false"></button>
          <button pButton type="submit" label="Guardar" icon="pi pi-check" [loading]="saving"></button>
        </div>
      </form>
    </p-dialog>

    <app-task-form
      [visible]="taskDialogVisible"
      [task]="editingTask"
      [columnId]="taskColumnId"
      [saving]="saving"
      [responsibleUsers]="responsibleUsers"
      (visibleChange)="taskDialogVisible = $event"
      (submitted)="saveTask($event)" />
  `,
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {
  board: ProjectBoard | null = null;
  loading = false;
  saving = false;
  columnDialogVisible = false;
  taskDialogVisible = false;
  downloadingReport: 'pdf' | 'excel' | null = null;
  editingColumn: BoardColumn | null = null;
  editingTask: BoardTask | null = null;
  taskColumnId: string | null = null;

  readonly columnForm = inject(FormBuilder).nonNullable.group({ name: ['', Validators.required] });
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boardService = inject(BoardService);
  private readonly boardRealtimeService = inject(BoardRealtimeService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private projectId = '';
  private pendingTaskId: string | null = null;

  get responsibleUsers(): ResponsibleUser[] {
    const users = this.board?.columns.flatMap(column => column.tasks.map(task => task.responsibleUser).filter((user): user is ResponsibleUser => !!user)) ?? [];
    return [...new Map(users.map(user => [user.id, user])).values()];
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') ?? '';
    this.boardRealtimeService.events$
      .pipe(
        filter(event => event.projectId === this.projectId),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => this.handleRealtimeEvent(event));
    this.loadBoard();
  }

  ngOnDestroy(): void {
    void this.boardRealtimeService.leaveBoard();
  }

  loadBoard(): void {
    if (!this.projectId) {
      return;
    }

    this.loading = true;
    this.boardService.getBoard(this.projectId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: board => {
        this.board = this.normalizeBoard(board);
        this.loading = false;
        void this.boardRealtimeService.joinBoard(this.projectId).catch(error => this.showError(error, 'No se pudo conectar al tablero'));
      },
      error: error => { this.loading = false; this.showError(error); }
    });
  }

  totalTasks(board: ProjectBoard): number { return board.columns.reduce((total, column) => total + column.tasks.length, 0); }
  trackColumn(_: number, column: BoardColumn): string { return column.id; }
  dropListId(column: BoardColumn): string { return `column-drop-${column.id}`; }
  dropListIds(board: ProjectBoard): string[] { return board.columns.map(column => this.dropListId(column)); }

  onColumnDrop(event: CdkDragDrop<BoardColumn[]>): void {
    if (!this.board || event.previousIndex === event.currentIndex) {
      return;
    }

    const snapshot = this.cloneBoard(this.board);
    moveItemInArray(this.board.columns, event.previousIndex, event.currentIndex);
    this.boardService.reorderColumns(this.projectId, this.board.columns.map(column => column.id)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: summaries => this.applyColumnOrder(summaries),
      error: error => { this.board = snapshot; this.showRollback('El orden de columnas fue revertido.'); this.showError(error, 'No se pudo reordenar'); }
    });
  }

  onTaskDrop(event: CdkDragDrop<BoardTask[]>): void {
    if (!this.board || this.pendingTaskId) {
      return;
    }

    const task = event.item.data as BoardTask;
    const destinationColumnId = event.container.id.replace('column-drop-', '');
    if (!task || !destinationColumnId) {
      return;
    }

    const snapshot = this.cloneBoard(this.board);
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }

    task.columnId = destinationColumnId;
    this.pendingTaskId = task.id;
    const request: TaskMoveRequest = { columnId: destinationColumnId, targetIndex: event.currentIndex };
    this.boardService.moveTask(this.projectId, task.id, request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: canonicalBoard => { this.board = this.normalizeBoard(canonicalBoard); this.pendingTaskId = null; },
      error: error => { this.board = snapshot; this.pendingTaskId = null; this.showRollback('El movimiento fue revertido porque el servidor lo rechazó.'); this.showError(error, 'No se pudo mover la tarea'); }
    });
  }

  openCreateColumn(): void {
    this.editingColumn = null;
    this.columnForm.reset({ name: '' });
    this.columnDialogVisible = true;
  }

  openEditColumn(column: BoardColumn): void {
    this.editingColumn = column;
    this.columnForm.reset({ name: column.name });
    this.columnDialogVisible = true;
  }

  saveColumn(): void {
    if (this.columnForm.invalid) {
      this.columnForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const request = { name: this.columnForm.getRawValue().name.trim() };
    const operation = this.editingColumn
      ? this.boardService.updateColumn(this.projectId, this.editingColumn.id, request)
      : this.boardService.createColumn(this.projectId, request);
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: summary => {
        if (this.board) {
          this.board = this.editingColumn
            ? { ...this.board, columns: this.board.columns.map(column => column.id === summary.id ? { ...column, ...summary } : column) }
            : { ...this.board, columns: [...this.board.columns, { ...summary, tasks: [] }] };
        }
        this.saving = false;
        this.columnDialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Columna guardada correctamente.' });
      },
      error: error => { this.saving = false; this.showError(error); }
    });
  }

  confirmDeleteColumn(column: BoardColumn): void {
    if (column.tasks.length > 0) {
      this.showError({ error: { message: 'No se puede eliminar una columna que contiene tareas.' } }, 'Columna no vacía');
      return;
    }

    this.confirmationService.confirm({
      message: `¿Eliminar “${column.name}”?`,
      header: 'Eliminar columna',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteColumn(column)
    });
  }

  private deleteColumn(column: BoardColumn): void {
    this.boardService.deleteColumn(this.projectId, column.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.board) {
          this.board = { ...this.board, columns: this.board.columns.filter(item => item.id !== column.id) };
        }
        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Columna eliminada.' });
      },
      error: error => this.showError(error)
    });
  }

  openCreateTask(column: BoardColumn): void {
    this.editingTask = null;
    this.taskColumnId = column.id;
    this.taskDialogVisible = true;
  }

  openEditTask(task: BoardTask): void {
    this.editingTask = task;
    this.taskColumnId = task.columnId;
    this.taskDialogVisible = true;
  }

  saveTask(request: CreateTaskRequest | UpdateTaskRequest): void {
    this.saving = true;
    const operation = this.editingTask
      ? this.boardService.updateTask(this.projectId, this.editingTask.id, request as UpdateTaskRequest)
      : this.boardService.createTask(this.projectId, request as CreateTaskRequest);
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: task => {
        if (this.board) {
          this.board = this.editingTask
            ? this.replaceTask(this.board, task)
            : this.appendTask(this.board, task);
        }
        this.saving = false;
        this.taskDialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Guardada', detail: 'Tarea guardada correctamente.' });
      },
      error: error => { this.saving = false; this.showError(error); }
    });
  }

  confirmDeleteTask(task: BoardTask): void {
    this.confirmationService.confirm({
      message: `¿Eliminar “${task.title}”?`,
      header: 'Eliminar tarea',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteTask(task)
    });
  }

  private deleteTask(task: BoardTask): void {
    this.boardService.deleteTask(this.projectId, task.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.board) {
          this.board = { ...this.board, columns: this.board.columns.map(column => ({ ...column, tasks: column.tasks.filter(item => item.id !== task.id) })) };
        }
        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Tarea eliminada.' });
      },
      error: error => this.showError(error)
    });
  }

  sortByPriority(column: BoardColumn): void {
    if (!this.board) {
      return;
    }

    const snapshot = column.tasks.map(task => ({ ...task }));
    column.tasks = [...column.tasks]
      .sort((left, right) => this.priorityValue(right.priority) - this.priorityValue(left.priority) || left.position - right.position)
      .map((task, index) => ({ ...task, position: (index + 1) * 1024 }));

    this.boardService.sortTasksByPriority(this.projectId, column.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: tasks => {
        if (this.board) {
          this.board = { ...this.board, columns: this.board.columns.map(item => item.id === column.id ? { ...item, tasks: this.normalizeTasks(tasks) } : item) };
        }
      },
      error: error => {
        column.tasks = snapshot;
        this.showRollback('El orden por prioridad fue revertido.');
        this.showError(error, 'No se pudo ordenar');
      }
    });
  }

  handleRealtimeEvent(event: BoardRealtimeEvent): void {
    if (!this.board || event.projectId !== this.board.id) {
      return;
    }

    switch (event.eventType) {
      case 'TaskCreated': {
        const task = event.state as BoardTask;
        if (!task?.id || this.board.columns.some(column => column.tasks.some(item => item.id === task.id))) {
          return;
        }

        this.board = {
          ...this.board,
          columns: this.board.columns.map(column => column.id === task.columnId
            ? { ...column, tasks: this.normalizeTasks([...column.tasks, task]) }
            : column)
        };
        return;
      }
      case 'TaskUpdated': {
        const task = event.state as BoardTask;
        if (task?.id) {
          this.board = this.replaceTask(this.board, task);
        }
        return;
      }
      case 'TaskDeleted': {
        const taskId = event.resourceId;
        if (taskId) {
          this.board = {
            ...this.board,
            columns: this.board.columns.map(column => ({ ...column, tasks: column.tasks.filter(task => task.id !== taskId) }))
          };
        }
        return;
      }
      case 'TaskMoved': {
        const canonicalBoard = event.state as ProjectBoard;
        if (canonicalBoard?.id === this.board.id) {
          this.board = this.normalizeBoard(canonicalBoard);
        }
        return;
      }
      case 'TasksReordered': {
        const state = event.state as { columnId?: string; tasks?: { taskId: string; position: number }[] };
        if (!state?.columnId || !state.tasks) {
          return;
        }

        const positions = new Map(state.tasks.map(item => [item.taskId, item.position]));
        this.board = {
          ...this.board,
          columns: this.board.columns.map(column => column.id === state.columnId
            ? {
                ...column,
                tasks: this.normalizeTasks(column.tasks.map(task => positions.has(task.id)
                  ? { ...task, position: positions.get(task.id)! }
                  : task))
              }
            : column)
        };
        return;
      }
      case 'ColumnCreated': {
        const column = event.state as ColumnSummary;
        if (!column?.id || this.board.columns.some(item => item.id === column.id)) {
          return;
        }

        this.board = this.normalizeBoard({ ...this.board, columns: [...this.board.columns, { ...column, tasks: [] }] });
        return;
      }
      case 'ColumnUpdated': {
        const column = event.state as ColumnSummary;
        if (column?.id) {
          this.board = this.normalizeBoard({ ...this.board, columns: this.board.columns.map(item => item.id === column.id ? { ...item, ...column } : item) });
        }
        return;
      }
      case 'ColumnDeleted': {
        if (event.resourceId) {
          this.board = { ...this.board, columns: this.board.columns.filter(column => column.id !== event.resourceId) };
        }
        return;
      }
      case 'ColumnsReordered': {
        const columns = event.state as ColumnSummary[];
        if (Array.isArray(columns)) {
          this.applyColumnOrder(columns);
        }
        return;
      }
    }
  }

  downloadReport(format: 'pdf' | 'excel'): void {
    this.downloadingReport = format;
    this.boardService.downloadReport(this.projectId, format).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        const blob = response.body;
        if (!blob) {
          this.downloadingReport = null;
          this.showError({ message: 'El reporte llegó vacío.' }, 'Descarga fallida');
          return;
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = this.fileNameFromHeaders(response.headers.get('content-disposition'))
          ?? `agile-task-hub-project-${this.projectId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        this.downloadingReport = null;
      },
      error: error => { this.downloadingReport = null; this.showError(error, 'Descarga fallida'); }
    });
  }

  goBack(): void { void this.router.navigate(['/projects']); }

  private applyColumnOrder(summaries: ColumnSummary[]): void {
    if (!this.board) {
      return;
    }

    const columnsById = new Map(this.board.columns.map(column => [column.id, column]));
    this.board = {
      ...this.board,
      columns: summaries.map(summary => ({ ...columnsById.get(summary.id)!, ...summary }))
    };
  }

  private replaceTask(board: ProjectBoard, task: BoardTask): ProjectBoard {
    return { ...board, columns: board.columns.map(column => ({ ...column, tasks: column.tasks.map(item => item.id === task.id ? task : item) })) };
  }

  private appendTask(board: ProjectBoard, task: BoardTask): ProjectBoard {
    return { ...board, columns: board.columns.map(column => column.id === task.columnId ? { ...column, tasks: [...column.tasks, task] } : column) };
  }

  private normalizeBoard(board: ProjectBoard): ProjectBoard {
    return { ...board, columns: [...board.columns].sort((a, b) => a.position - b.position).map(column => ({ ...column, tasks: this.normalizeTasks(column.tasks) })) };
  }

  private normalizeTasks(tasks: BoardTask[]): BoardTask[] { return [...tasks].sort((a, b) => a.position - b.position); }
  private priorityValue(priority: BoardTask['priority']): number { return { Low: 1, Medium: 2, High: 3, Urgent: 4 }[priority]; }
  private cloneBoard(board: ProjectBoard): ProjectBoard { return { ...board, columns: board.columns.map(column => ({ ...column, tasks: column.tasks.map(task => ({ ...task, responsibleUser: task.responsibleUser ? { ...task.responsibleUser } : null })) })) }; }

  private fileNameFromHeaders(contentDisposition: string | null): string | null {
    if (!contentDisposition) {
      return null;
    }

    const match = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i.exec(contentDisposition);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }

  private showRollback(detail: string): void { this.messageService.add({ severity: 'warn', summary: 'Cambio revertido', detail }); }

  private showError(error: { error?: { message?: string }; message?: string }, summary = 'Solicitud fallida'): void {
    this.messageService.add({ severity: 'error', summary, detail: error.error?.message ?? error.message ?? 'Inténtalo de nuevo.' });
  }
}
