import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Project, ProjectRequest, ProjectStatus } from '../../../core/models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectFormComponent } from '../project-form/project-form.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, ConfirmDialogModule, DialogModule, InputTextModule, PaginatorModule, ProgressSpinnerModule, SkeletonModule, TableModule, TagModule, ToastModule, ProjectFormComponent],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="page-heading"><div><span class="kicker">PROJECTS</span><h1>Projects</h1><p>Plan and track the work moving through your workspace.</p></div><p-button label="New project" icon="pi pi-plus" (onClick)="openCreate()" /></div>
    <section class="panel">
      <div class="toolbar"><div class="search-box"><i class="pi pi-search"></i><input pInputText [formControl]="searchControl" placeholder="Search projects..." aria-label="Search projects" /></div><span class="result-count" *ngIf="!loading">{{ totalItems }} project{{ totalItems === 1 ? '' : 's' }}</span></div>
      <p-table [value]="projects" [loading]="loading" [tableStyle]="{ 'min-width': '48rem' }" responsiveLayout="scroll">
        <ng-template pTemplate="header"><tr><th>Project</th><th>Status</th><th>Start date</th><th>Expected end</th><th class="actions-heading">Actions</th></tr></ng-template>
        <ng-template pTemplate="loadingbody"><tr *ngFor="let row of skeletonRows"><td><p-skeleton width="12rem" /><p-skeleton width="8rem" styleClass="sub-skeleton" /></td><td><p-skeleton width="5rem" /></td><td><p-skeleton width="6rem" /></td><td><p-skeleton width="6rem" /></td><td><p-skeleton width="8rem" /></td></tr></ng-template>
        <ng-template pTemplate="body" let-project><tr><td><div class="project-cell"><span class="project-mark"></span><div><strong>{{ project.name }}</strong><span>{{ project.description || 'No description' }}</span></div></div></td><td><p-tag [value]="project.status" [severity]="statusSeverity(project.status)"></p-tag></td><td>{{ project.startDate | date:'mediumDate' }}</td><td>{{ project.expectedEndDate | date:'mediumDate' }}</td><td><div class="row-actions"><button pButton text="true" rounded="true" icon="pi pi-eye" aria-label="View project" (click)="viewProject(project)"></button><button pButton text="true" rounded="true" icon="pi pi-pencil" aria-label="Edit project" (click)="openEdit(project)"></button><button pButton text="true" rounded="true" severity="danger" icon="pi pi-trash" aria-label="Delete project" (click)="confirmDelete(project)"></button><button pButton text="true" rounded="true" icon="pi pi-th-large" aria-label="Open board" (click)="openBoard(project)"></button></div></td></tr></ng-template>
        <ng-template pTemplate="emptymessage"><tr><td colspan="5"><div class="empty-state"><i class="pi pi-folder-open"></i><strong>{{ searchControl.value ? 'No matching projects' : 'No projects yet' }}</strong><span>{{ searchControl.value ? 'Try another search term.' : 'Create your first project to get started.' }}</span><p-button *ngIf="!searchControl.value" label="Create project" icon="pi pi-plus" [outlined]="true" (onClick)="openCreate()" /></div></td></tr></ng-template>
      </p-table>
      <p-paginator [first]="first" [rows]="pageSize" [totalRecords]="totalItems" [rowsPerPageOptions]="[5, 10, 20]" (onPageChange)="pageChanged($event)"></p-paginator>
    </section>

    <app-project-form [visible]="formVisible" [project]="editingProject" [saving]="saving" (submitted)="saveProject($event)" (closed)="closeForm()" />
    <p-dialog [(visible)]="detailsVisible" [modal]="true" [style]="{ width: 'min(30rem, 95vw)' }" header="Project details">
      <div *ngIf="viewedProject" class="details"><div><span>Name</span><strong>{{ viewedProject.name }}</strong></div><div><span>Description</span><strong>{{ viewedProject.description || 'No description' }}</strong></div><div class="details-grid"><div><span>Status</span><p-tag [value]="viewedProject.status" [severity]="statusSeverity(viewedProject.status)"></p-tag></div><div><span>Timeline</span><strong>{{ viewedProject.startDate | date:'mediumDate' }} â€“ {{ viewedProject.expectedEndDate | date:'mediumDate' }}</strong></div></div></div>
    </p-dialog>
  `,
  styles: [`
    .kicker { color: #6366f1; font-size: .7rem; font-weight: 700; letter-spacing: .12em; }
    .page-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2rem; }
    .page-heading h1 { margin: .55rem 0 .35rem; color: #182230; font-size: 1.75rem; letter-spacing: -.04em; }
    .page-heading p { margin: 0; color: #98a2b3; font-size: .85rem; }
    .panel { min-width: 0; padding: 1.4rem; background: #fff; border: 1px solid #edf0f4; border-radius: .9rem; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.1rem; }
    .search-box { position: relative; max-width: 22rem; width: 100%; }.search-box i { position: absolute; left: .75rem; top: .75rem; color: #98a2b3; }.search-box input { width: 100%; padding-left: 2.2rem; }.result-count { color: #98a2b3; font-size: .75rem; }
    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th { padding: .75rem .65rem; border-width: 0 0 1px; border-color: #edf0f4; color: #98a2b3; font-size: .68rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td { padding: .9rem .65rem; border-color: #f2f4f7; color: #667085; font-size: .78rem; }.project-cell { display: flex; align-items: center; gap: .65rem; }.project-cell > div { display: flex; flex-direction: column; gap: .2rem; }.project-cell strong { color: #344054; font-size: .8rem; }.project-cell span:not(.project-mark) { color: #98a2b3; font-size: .68rem; }.project-mark { width: .55rem; height: 2rem; border-radius: .3rem; background: #6366f1; }.actions-heading { text-align: right; }.row-actions { display: flex; justify-content: flex-end; gap: .1rem; }.sub-skeleton { margin-top: .35rem; }.empty-state { display: flex; align-items: center; gap: .55rem; padding: 3rem 1rem; flex-direction: column; color: #98a2b3; }.empty-state i { color: #818cf8; font-size: 2rem; }.empty-state strong { color: #344054; }.empty-state span { font-size: .78rem; }.details { display: flex; flex-direction: column; gap: 1rem; }.details > div, .details-grid > div { display: flex; flex-direction: column; gap: .3rem; }.details span { color: #98a2b3; font-size: .72rem; }.details strong { color: #344054; font-size: .86rem; }.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 600px) { .page-heading { align-items: flex-start; flex-direction: column; gap: 1rem; }.toolbar { align-items: stretch; flex-direction: column; }.details-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProjectListComponent implements OnInit {
  readonly skeletonRows = [1, 2, 3, 4];
  readonly searchControl = new FormControl('', { nonNullable: true });
  projects: Project[] = [];
  pageSize = 10;
  first = 0;
  totalItems = 0;
  loading = false;
  saving = false;
  formVisible = false;
  detailsVisible = false;
  editingProject: Project | null = null;
  viewedProject: Project | null = null;

  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.first = 0;
      this.loadProjects();
    });
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.list(Math.floor(this.first / this.pageSize) + 1, this.pageSize, this.searchControl.value).pipe(
      finalize(() => this.loading = false),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => { this.projects = result.items; this.totalItems = result.totalItems; },
      error: (error) => this.showError(error)
    });
  }

  pageChanged(event: PaginatorState): void {
    this.first = event.first ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    this.loadProjects();
  }

  openCreate(): void { this.editingProject = null; this.formVisible = true; }

  openEdit(project: Project): void {
    this.loading = true;
    this.projectService.getById(project.id).pipe(finalize(() => this.loading = false), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (loaded) => { this.editingProject = loaded; this.formVisible = true; },
      error: (error) => this.showError(error)
    });
  }

  closeForm(): void { this.formVisible = false; this.editingProject = null; }

  saveProject(request: ProjectRequest): void {
    this.saving = true;
    const operation = this.editingProject ? this.projectService.update(this.editingProject.id, request) : this.projectService.create(request);
    operation.pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.closeForm(); this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Project saved successfully.' }); this.loadProjects(); },
      error: (error) => this.showError(error)
    });
  }

  viewProject(project: Project): void {
    this.projectService.getById(project.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (loaded) => { this.viewedProject = loaded; this.detailsVisible = true; },
      error: (error) => this.showError(error)
    });
  }

  confirmDelete(project: Project): void {
    this.confirmationService.confirm({ message: `Delete â€œ${project.name}â€? This action cannot be undone.`, header: 'Delete project', icon: 'pi pi-exclamation-triangle', acceptButtonStyleClass: 'p-button-danger', accept: () => this.deleteProject(project) });
  }

  openBoard(project: Project): void { void this.router.navigate(['/projects', project.id, 'board']); }

  statusSeverity(status: ProjectStatus): 'success' | 'info' | 'warning' | 'danger' {
    const severities: Record<ProjectStatus, 'success' | 'info' | 'warning' | 'danger'> = { Active: 'success', Planned: 'info', Completed: 'warning', Cancelled: 'danger' };
    return severities[status];
  }

  private deleteProject(project: Project): void {
    this.projectService.delete(project.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Project deleted.' }); this.loadProjects(); },
      error: (error) => this.showError(error)
    });
  }

  private showError(error: { error?: { message?: string }; message?: string }): void {
    this.messageService.add({ severity: 'error', summary: 'Request failed', detail: error.error?.message ?? error.message ?? 'Please try again.' });
  }
}

