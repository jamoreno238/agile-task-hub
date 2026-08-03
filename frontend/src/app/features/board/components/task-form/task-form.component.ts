import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { BoardTask, CreateTaskRequest, ResponsibleUser, TaskPriority, UpdateTaskRequest } from '../../../../core/models/board.model';

type TaskFormRequest = CreateTaskRequest | UpdateTaskRequest;

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, DialogModule, DropdownModule, InputTextModule, InputTextareaModule],
  template: `
    <p-dialog
      [visible]="visible"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(34rem, 95vw)' }"
      [header]="task ? 'Editar tarea' : 'Nueva tarea'"
      (visibleChange)="visibleChange.emit($event)">
      <form class="task-form" [formGroup]="form" (ngSubmit)="submit()">
        <label for="task-title">Título</label>
        <input id="task-title" pInputText formControlName="title" maxlength="240" autofocus />
        <small class="field-error" *ngIf="form.controls.title.invalid && form.controls.title.touched">El título es obligatorio.</small>

        <label for="task-description">Descripción</label>
        <textarea id="task-description" pInputTextarea formControlName="description" rows="4" maxlength="8000"></textarea>

        <label for="task-priority">Prioridad</label>
        <p-dropdown
          inputId="task-priority"
          formControlName="priority"
          [options]="priorities"
          optionLabel="label"
          optionValue="value"
          appendTo="body" />

        <label for="task-responsible">Responsable</label>
        <p-dropdown
          inputId="task-responsible"
          formControlName="responsibleUserId"
          [options]="responsibleUsers"
          optionLabel="name"
          optionValue="id"
          [showClear]="true"
          placeholder="Sin responsable"
          appendTo="body" />

        <div class="form-actions">
          <button pButton type="button" label="Cancelar" severity="secondary" [text]="true" (click)="visibleChange.emit(false)"></button>
          <button pButton type="submit" label="Guardar tarea" icon="pi pi-check" [loading]="saving"></button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .task-form { display: flex; flex-direction: column; gap: .45rem; }
    .task-form label { margin-top: .35rem; color: #475467; font-size: .78rem; font-weight: 600; }
    .task-form input, .task-form textarea, :host ::ng-deep .p-dropdown { width: 100%; }
    .field-error { color: #dc2626; font-size: .7rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
  `]
})
export class TaskFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() task: BoardTask | null = null;
  @Input() columnId: string | null = null;
  @Input() saving = false;
  @Input() responsibleUsers: ResponsibleUser[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submitted = new EventEmitter<TaskFormRequest>();

  readonly priorities: { label: string; value: TaskPriority }[] = [
    { label: 'Baja', value: 'Low' },
    { label: 'Media', value: 'Medium' },
    { label: 'Alta', value: 'High' },
    { label: 'Urgente', value: 'Urgent' }
  ];
  readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(240)]],
    description: ['', Validators.maxLength(8000)],
    priority: ['Medium' as TaskPriority, Validators.required],
    responsibleUserId: [null as string | null]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue || changes['task']) {
      this.form.reset({
        title: this.task?.title ?? '',
        description: this.task?.description ?? '',
        priority: this.task?.priority ?? 'Medium',
        responsibleUserId: this.task?.responsibleUserId ?? null
      });
    }
  }

  submit(): void {
    if (this.form.invalid || (!this.task && !this.columnId)) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const base = {
      title: value.title.trim(),
      description: value.description.trim(),
      priority: value.priority,
      responsibleUserId: value.responsibleUserId
    };
    this.submitted.emit(this.task ? base : { ...base, columnId: this.columnId! });
  }
}
