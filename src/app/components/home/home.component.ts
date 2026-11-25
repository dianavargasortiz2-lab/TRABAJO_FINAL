import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  RESTAURANT_ADDRESS,
  WHATSAPP_PHONE_DISPLAY,
  WHATSAPP_NUMBER,
} from '../../data/business-contact';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  readonly address = RESTAURANT_ADDRESS;
  readonly whatsappPhone = WHATSAPP_PHONE_DISPLAY;
  readonly whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`;
}
