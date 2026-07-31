import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProjectStatus, ProjectSummary } from '../../core/models/project.model';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TagModule],
  template: `
    <div class="page-heading"><div><span class="kicker">MONDAY, JULY 28, 2026</span><h1>Good morning, Alex <span>👋</span></h1><p>Here’s what’s happening across your workspace today.</p></div><p-button label="New project" icon="pi pi-plus" /></div>
    <div class="metrics"><article><div class="metric-icon purple"><i class="pi pi-briefcase"></i></div><div><span>Active projects</span><strong>8</strong><small><i class="pi pi-arrow-up"></i> 12% <em>vs last month</em></small></div></article><article><div class="metric-icon blue"><i class="pi pi-check-square"></i></div><div><span>Tasks completed</span><strong>124</strong><small><i class="pi pi-arrow-up"></i> 18% <em>vs last month</em></small></div></article><article><div class="metric-icon orange"><i class="pi pi-clock"></i></div><div><span>Due this week</span><strong>16</strong><small class="neutral"><i class="pi pi-minus"></i> 2% <em>vs last month</em></small></div></article><article><div class="metric-icon green"><i class="pi pi-users"></i></div><div><span>Team members</span><strong>24</strong><small><i class="pi pi-arrow-up"></i> 4% <em>vs last month</em></small></div></article></div>
    <div class="content-grid"><section class="panel projects-panel"><div class="panel-heading"><div><h2>Projects</h2><p>Track progress across your active work.</p></div><button class="more-button">View all <i class="pi pi-arrow-up-right"></i></button></div><p-table [value]="projects" [tableStyle]="{ 'min-width': '42rem' }"><ng-template pTemplate="header"><tr><th>Project</th><th>Status</th><th>Progress</th><th>Due date</th><th>Team</th></tr></ng-template><ng-template pTemplate="body" let-project><tr><td><div class="project-cell"><span class="project-mark" [class]="project.tone"></span><div><strong>{{ project.name }}</strong><span>{{ project.description }}</span></div></div></td><td><p-tag [value]="project.status" [severity]="statusSeverity(project.status)"></p-tag></td><td><div class="progress-cell"><div class="progress-track"><span [style.width.%]="project.progress"></span></div><small>{{ project.progress }}%</small></div></td><td>{{ project.dueDate }}</td><td><span class="member-count"><i class="pi pi-users"></i>{{ project.members }}</span></td></tr></ng-template></p-table></section><section class="panel activity-panel"><div class="panel-heading"><div><h2>Recent activity</h2><p>Latest updates from your team.</p></div><button class="more-button"><i class="pi pi-ellipsis-h"></i></button></div><div class="activity" *ngFor="let item of activity"><span class="activity-avatar" [style.background]="item.color">{{ item.initials }}</span><div><p><strong>{{ item.name }}</strong> {{ item.action }}</p><span>{{ item.time }}</span></div></div></section></div>
  `,
  styleUrls: ['./projects-page.component.scss']
})
export class ProjectsPageComponent {
  readonly projects: (ProjectSummary & { tone: string })[] = [
    { id: '1', name: 'Website redesign', description: 'Marketing · Q3 2026', status: 'Active', progress: 72, dueDate: 'Aug 14, 2026', members: 8, tone: 'indigo' },
    { id: '2', name: 'Mobile app v2', description: 'Product · Q3 2026', status: 'Active', progress: 48, dueDate: 'Sep 02, 2026', members: 12, tone: 'blue' },
    { id: '3', name: 'Customer onboarding', description: 'Growth · Q3 2026', status: 'Planned', progress: 18, dueDate: 'Sep 18, 2026', members: 5, tone: 'orange' },
    { id: '4', name: 'Design system', description: 'Platform · Q2 2026', status: 'Completed', progress: 100, dueDate: 'Jul 30, 2026', members: 6, tone: 'green' }
  ];

  readonly activity = [
    { initials: 'JR', name: 'Jamie Rivera', action: 'moved “User testing” to Done', time: '12 minutes ago', color: '#f97316' },
    { initials: 'SK', name: 'Sam Kim', action: 'commented on Mobile app v2', time: '1 hour ago', color: '#0ea5e9' },
    { initials: 'ML', name: 'Morgan Lee', action: 'created a new project', time: '3 hours ago', color: '#8b5cf6' },
    { initials: 'AM', name: 'Alex Morgan', action: 'updated project timeline', time: 'Yesterday at 4:32 PM', color: '#10b981' }
  ];

  statusSeverity(status: ProjectStatus): 'success' | 'info' | 'warning' | 'danger' {
    const severities: Record<ProjectStatus, 'success' | 'info' | 'warning' | 'danger'> = { Active: 'success', Planned: 'info', Completed: 'warning', Cancelled: 'danger' };
    return severities[status];
  }
}
