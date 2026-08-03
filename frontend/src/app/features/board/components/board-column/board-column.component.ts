import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CdkDragDrop, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { BoardColumn, BoardTask } from '../../../../core/models/board.model';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCardComponent],
  template: `
    <section class="column">
      <header class="column-heading">
        <div class="column-title">
          <span class="column-dot"></span>
          <strong>{{ column.name }}</strong>
          <small>{{ column.tasks.length }}</small>
        </div>
        <div class="column-actions">
          <button type="button" title="Ordenar por prioridad" (click)="sort.emit(column)">
            <i class="pi pi-sort-amount-down" aria-hidden="true"></i>
          </button>
          <button type="button" title="Editar columna" (click)="edit.emit(column)">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button type="button" title="Eliminar columna" (click)="remove.emit(column)">
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </header>
      <div
        class="task-list"
        cdkDropList
        [id]="dropListId"
        [cdkDropListData]="column.tasks"
        [cdkDropListConnectedTo]="connectedDropListIds"
        (cdkDropListDropped)="taskDropped.emit($event)">
        <app-task-card
          *ngFor="let task of column.tasks; trackBy: trackTask"
          [task]="task"
          (edit)="taskEdit.emit($event)"
          (remove)="taskRemove.emit($event)" />
        <div class="empty-column" *ngIf="column.tasks.length === 0">Suelta una tarea aquí</div>
      </div>
      <button type="button" class="add-card" (click)="addTask.emit(column)">
        <i class="pi pi-plus" aria-hidden="true"></i> Añadir tarea
      </button>
    </section>
  `,
  styleUrls: ['./board-column.component.scss']
})
export class BoardColumnComponent {
  @Input({ required: true }) column!: BoardColumn;
  @Input() dropListId = '';
  @Input() connectedDropListIds: string[] = [];
  @Output() taskDropped = new EventEmitter<CdkDragDrop<BoardTask[]>>();
  @Output() addTask = new EventEmitter<BoardColumn>();
  @Output() edit = new EventEmitter<BoardColumn>();
  @Output() remove = new EventEmitter<BoardColumn>();
  @Output() sort = new EventEmitter<BoardColumn>();
  @Output() taskEdit = new EventEmitter<BoardTask>();
  @Output() taskRemove = new EventEmitter<BoardTask>();

  trackTask(_: number, task: BoardTask): string { return task.id; }
}
