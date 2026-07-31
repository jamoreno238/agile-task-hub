import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { BoardTask } from '../../core/models/task.model';

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `<div class="board-heading"><div><span class="kicker">PROJECT BOARD</span><h1>Website redesign</h1><p>A focused view of the work moving through your delivery flow.</p></div><p-button label="Add task" icon="pi pi-plus" /></div><div class="board-grid"><section class="column" *ngFor="let column of columns"><div class="column-heading"><div><span class="column-dot" [class]="column.tone"></span><strong>{{ column.name }}</strong><small>{{ column.tasks.length }}</small></div><button><i class="pi pi-ellipsis-h"></i></button></div><article class="task-card" *ngFor="let task of column.tasks"><div class="task-label" [class]="task.priority.toLowerCase()"><span>{{ task.priority }}</span><i class="pi pi-arrow-up-right"></i></div><h3>{{ task.title }}</h3><div class="task-footer"><span class="avatar">{{ task.assignee }}</span><span><i class="pi pi-comment"></i> 3</span><span><i class="pi pi-paperclip"></i> 1</span></div></article><button class="add-card"><i class="pi pi-plus"></i> Add task</button></section></div>`,
  styleUrls: ['./board-page.component.scss']
})
export class BoardPageComponent {
  readonly columns = [
    { name: 'Backlog', tone: 'gray', tasks: [{ id: '1', title: 'Define responsive breakpoints', priority: 'Medium', assignee: 'JR' }, { id: '2', title: 'Collect mobile feedback', priority: 'Low', assignee: 'SK' }] as BoardTask[] },
    { name: 'In progress', tone: 'indigo', tasks: [{ id: '3', title: 'Build navigation patterns', priority: 'High', assignee: 'AM' }, { id: '4', title: 'Prepare usability test', priority: 'Urgent', assignee: 'ML' }] as BoardTask[] },
    { name: 'Review', tone: 'orange', tasks: [{ id: '5', title: 'Approve landing page copy', priority: 'High', assignee: 'AM' }] as BoardTask[] },
    { name: 'Done', tone: 'green', tasks: [{ id: '6', title: 'Create visual direction', priority: 'Medium', assignee: 'JR' }] as BoardTask[] }
  ];
}
