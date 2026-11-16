import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMoneyBills } from '@fortawesome/free-solid-svg-icons';

@Component({
  imports: [RouterLink, FaIconComponent],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  readonly brandIcon = faMoneyBills;
}
