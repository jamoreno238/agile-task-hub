import { Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `<span class="logo-mark"><i class="pi pi-bolt"></i></span><span class="logo-label">Agile<span>Task</span>Hub</span>`,
  styles: [`
    :host { display: inline-flex; align-items: center; gap: .65rem; font-weight: 700; color: #182230; }
    .logo-mark { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .7rem; background: #6366f1; color: #fff; box-shadow: 0 6px 16px rgba(99, 102, 241, .28); }
    .logo-label span { color: #6366f1; }
  `]
})
export class AppLogoComponent {}
