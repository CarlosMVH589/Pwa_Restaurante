import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-cajero',
  standalone: true,
  imports: [],
  templateUrl: './cajero.html',
  styleUrl: './cajero.scss'
})
export class CajeroPage {
  constructor(private readonly location: Location) {}

  regresar(): void {
    this.location.back();
  }
}