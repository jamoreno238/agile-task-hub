import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { BoardTask, TaskPriority } from '../../../../core/models/board.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, CdkDrag],
  template: `
    <article class="task-card" cdkDrag [cdkDragData]="task">
      <div class="task-card-content">
        <div class="task-label" [class]="task.priority.toLowerCase()">
          <span>{{ priorityLabel(task.priority) }}</span>
          <i class="pi pi-arrow-up-right" aria-hidden="true"></i>
        </div>
        <h3>{{ task.title }}</h3>
        <p *ngIf="task.description">{{ task.description }}</p>
        <div class="task-footer">
          <span class="avatar" [title]="task.responsibleUser?.name ?? 'Sin responsable'">
            {{ initials(task.responsibleUser?.name) }}
          </span>
          <span class="responsible-name">{{ task.responsibleUser?.name ?? 'Sin responsable' }}</span>
          <button type="button" title="Editar tarea" aria-label="Editar tarea" (click)="edit.emit(task); $event.stopPropagation()">
            <i class="pi pi-pencil" aria-hidden="true"></i>
          </button>
          <button type="button" title="Eliminar tarea" aria-label="Eliminar tarea" (click)="remove.emit(task); $event.stopPropagation()">
            <i class="pi pi-trash" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div class="drag-placeholder" *cdkDragPlaceholder></div>
    </article>
  `,
  styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent {
  @Input({ required: true }) task!: BoardTask;
  @Output() edit = new EventEmitter<BoardTask>();
  @Output() remove = new EventEmitter<BoardTask>();

  priorityLabel(priority: TaskPriority): string {
    return { Low: 'Baja', Medium: 'Media', High: 'Alta', Urgent: 'Urgente' }[priority];
  }

  initials(name?: string): string {
    if (!name) {
      return '?';
    }

    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }
}
