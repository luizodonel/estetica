import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar.component';
import { BottomNavComponent } from './shared/bottom-nav.component';
import { TenantService } from './core/services/tenant.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavbarComponent, BottomNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  tenantService = inject(TenantService);
  title = 'estetica-web';
}
