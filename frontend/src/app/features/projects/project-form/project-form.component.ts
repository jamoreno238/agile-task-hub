import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Project, ProjectRequest, ProjectStatus } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, DialogModule, DropdownModule, InputTextModule, ProgressSpinnerModule],
  template: `
    <p-dialog [(visible)]="visible" [modal]="true" [style]="{ width: 'min(34rem, 95vw)' }" [header]="project ? 'Edit project' : 'New project'" (onHide)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" class="project-form">
        <label for="project-name">Name</label>
        <input id="project-name" pInputText formControlName="name" placeholder="e.g. Website redesign" />
        <small class="field-error" *ngIf="form.controls.name.invalid && form.controls.name.touched">Enter a project name (maximum 180 characters).</small>

        <label for="project-description">Description</label>
        <textarea id="project-description" formControlName="description" rows="4" placeholder="What is this project about?"></textarea>
        <small class="field-error" *ngIf="form.controls.description.invalid && form.controls.description.touched">Description cannot exceed 4,000 characters.</small>

        <div class="form-grid">
          <div><label for="project-start">Start date</label><input id="project-start" type="date" pInputText formControlName="startDate" /></div>
          <div><label for="project-end">Expected end date</label><input id="project-end" type="date" pInputText formControlName="expectedEndDate" /></div>
        </div>
        <small class="field-error" *ngIf="form.hasError('dateRange')">Expected end date cannot be earlier than start date.</small>

        <label for="project-status">Status</label>
        <p-dropdown inputId="project-status" [options]="statuses" formControlName="status" optionLabel="label" optionValue="value" placeholder="Select a status" appendTo="body"></p-dropdown>
        <small class="field-error" *ngIf="form.controls.status.invalid && form.controls.status.touched">Select a project status.</small>

        <div class="form-actions"><p-button type="button" label="Cancel" severity="secondary" [text]="true" (onClick)="closed.emit()" /><p-button type="submit" [label]="saving ? 'Saving...' : 'Save project'" [loading]="saving" /></div>
      </form>
    </p-dialog>
  `,
  styles: [`
    .project-form { display: flex; flex-direction: column; gap: .45rem; }
    .project-form label { margin-top: .55rem; color: #344054; font-size: .8rem; font-weight: 600; }
    .project-form input, .project-form textarea, .project-form p-dropdown { width: 100%; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }
    .form-grid > div { display: flex; flex-direction: column; gap: .45rem; }
    .field-error { color: #dc2626; font-size: .7rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1.1rem; }
    @media (max-width: 500px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProjectFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() project: Project | null = null;
  @Input() saving = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submitted = new EventEmitter<ProjectRequest>();
  @Output() closed = new EventEmitter<void>();

  readonly statuses = Object.values(ProjectStatus).map((value) => ({ label: value, value }));
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(180)]],
    description: ['', Validators.maxLength(4000)],
    startDate: ['', Validators.required],
    expectedEndDate: ['', Validators.required],
    status: [ProjectStatus.Planned, Validators.required]
  }, { validators: (group) => {
    const start = group.get('startDate')?.value;
    const end = group.get('expectedEndDate')?.value;
    return start && end && end < start ? { dateRange: true } : null;
  }});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue && changes['visible'].currentValue !== changes['visible'].previousValue) {
      this.form.reset({
        name: this.project?.name ?? '',
        description: this.project?.description ?? '',
        startDate: this.toDateInput(this.project?.startDate),
        expectedEndDate: this.toDateInput(this.project?.expectedEndDate),
        status: this.project?.status ?? ProjectStatus.Planned
      });
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      name: value.name.trim(),
      description: value.description.trim(),
      startDate: `${value.startDate}T00:00:00.000Z`,
      expectedEndDate: `${value.expectedEndDate}T00:00:00.000Z`,
      status: value.status
    });
  }

  private toDateInput(value?: string): string {
    return value ? value.slice(0, 10) : '';
  }
}

