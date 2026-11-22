import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEAM } from '../../data/catalog';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './team.component.html',
})
export class TeamComponent {
  readonly members = TEAM;
}
