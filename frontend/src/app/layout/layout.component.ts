import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { AppLogoComponent } from '../shared/components/app-logo.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, AvatarModule, ButtonModule, AppLogoComponent],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><app-logo /></div>
        <div class="workspace-switcher">
          <span class="eyebrow">WORKSPACE</span>
          <button class="workspace-button"><span class="workspace-dot"></span><span>IdeasGroup</span><i class="pi pi-chevron-down"></i></button>
        </div>
        <nav class="navigation" aria-label="Main navigation">
          <span class="eyebrow">WORKSPACE</span>
          <a routerLink="/projects" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><i class="pi pi-briefcase"></i><span>Projects</span></a>
          <a routerLink="/board" routerLinkActive="active"><i class="pi pi-th-large"></i><span>Board</span><span class="nav-count">12</span></a>
          <a><i class="pi pi-chart-line"></i><span>Insights</span><span class="soon">Soon</span></a>
          <span class="eyebrow section-label">MANAGE</span>
          <a><i class="pi pi-users"></i><span>Members</span></a>
          <a><i class="pi pi-cog"></i><span>Settings</span></a>
        </nav>
        <div class="sidebar-footer">
          <div class="help-card"><i class="pi pi-sparkles"></i><strong>Make work flow</strong><span>Plan, focus and deliver with your team.</span><button>Explore guide <i class="pi pi-arrow-up-right"></i></button></div>
          <div class="profile"><p-avatar label="AM" shape="circle" /><div><strong>Alex Morgan</strong><span>Product lead</span></div><i class="pi pi-ellipsis-h"></i></div>
        </div>
      </aside>
      <main class="main-content">
        <header class="topbar">
          <div class="breadcrumb"><span>Workspace</span><i class="pi pi-angle-right"></i><strong>Overview</strong></div>
          <div class="topbar-actions"><button class="icon-button"><i class="pi pi-search"></i></button><button class="icon-button notification"><i class="pi pi-bell"></i><span></span></button><p-button label="Invite member" icon="pi pi-plus" [rounded]="true" /></div>
        </header>
        <section class="page-content"><router-outlet /></section>
      </main>
    </div>
  `,
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {}
