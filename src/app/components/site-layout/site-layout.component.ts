import { Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { WHATSAPP_NUMBER } from '../../data/business-contact';

@Component({
  selector: 'app-site-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './site-layout.component.html',
})
export class SiteLayoutComponent {
  readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Asadero%20Con%20Af%C3%A1n`;
  menuAbierto = false;
  private footerClicks = 0;
  private footerTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly router: Router) {}

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
    document.body.style.overflow = this.menuAbierto ? 'hidden' : '';
  }

  closeMenu(): void {
    this.menuAbierto = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  onFooterClick(): void {
    this.footerClicks += 1;
    if (this.footerTimer) clearTimeout(this.footerTimer);
    this.footerTimer = setTimeout(() => (this.footerClicks = 0), 3000);
    if (this.footerClicks >= 5) {
      this.footerClicks = 0;
      this.router.navigate(['/admin/login']);
    }
  }
}
