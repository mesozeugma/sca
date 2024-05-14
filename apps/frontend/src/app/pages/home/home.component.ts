import { Component } from '@angular/core';

import { TokenService } from '../../shared/services/token.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  modules = [
    {
      name: 'visualizations',
      adminOnly: false,
      description:
        'View graphs showing various aspects of simulators and compare them.',
    },
    {
      name: 'explore',
      adminOnly: false,
      description: 'View the source code of the simulators.',
    },
    {
      name: 'repositories',
      adminOnly: true,
      description: 'Manage repositories.',
    },
    {
      name: 'tasks',
      adminOnly: true,
      description: 'View existing tasks. Start new task.',
    },
  ];

  constructor(private readonly tokenService: TokenService) {}

  logout() {
    this.tokenService.deleteToken();
  }

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }
}
