import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-validar-arqueo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './validar-arqueo.html',
  styleUrl: './validar-arqueo.scss'
})
export class ValidarArqueoComponent {
  constructor(private readonly router: Router) {}

  @Input() efectivoSistema: number = 3450.00;
  @Input() efectivoArqueado: number = 5450.00;

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() auditoriaFinalizada = new EventEmitter<{
    justificacion: string;
    pin: string;
    diferencia: number;
  }>();

  justificacion: string = 'Sobrante correspondiente a fondo de caja inicial de apertura autorizado por Gerencia.';
  pinGerente: string = '';
  confirmado: boolean = true;
  errorMensaje: string = '';
  mensajeEstado: string = '';
  auditoriaFirmada = false;
  mostrarFirma = false;
  firmaNombre = '';
  firmaConfirmada = false;

  get diferencia(): number {
    return this.efectivoArqueado - this.efectivoSistema;
  }

  get esSobrante(): boolean {
    return this.diferencia >= 0;
  }

  get formularioValido(): boolean {
    const requiereJustificacion = this.diferencia !== 0;
    const justificacionOk = !requiereJustificacion || this.justificacion.trim().length >= 10;
    const pinOk = this.pinGerente.trim().length >= 4;
    return justificacionOk && pinOk && this.confirmado;
  }

  onCerrar(): void {
    this.cerrarModal.emit();
  }

  regresarAConteo(): void {
    this.router.navigate(['/gerente']);
    this.cerrarModal.emit();
  }

  firmarYFinalizar(): void {
    this.errorMensaje = '';
    this.mensajeEstado = '';

    if (this.diferencia !== 0 && this.justificacion.trim().length < 10) {
      this.errorMensaje = 'Debes ingresar una justificación válida de al menos 10 caracteres.';
      return;
    }
//comentario
    if (this.pinGerente.trim().length < 4) {
      this.errorMensaje = 'Por favor ingresa un PIN de gerente válido (mínimo 4 dígitos).';
      return;
    }

    if (!this.confirmado) {
      this.errorMensaje = 'Debes confirmar que el conteo físico es correcto.';
      return;
    }

    this.errorMensaje = '';
    this.mostrarFirma = true;
  }

  confirmarFirma(): void {
    if (this.firmaNombre.trim().length < 3 || !this.firmaConfirmada) {
      this.errorMensaje = 'Escribe tu nombre y confirma la firma para continuar.';
      return;
    }

    this.auditoriaFinalizada.emit({
      justificacion: this.justificacion,
      pin: this.pinGerente,
      diferencia: this.diferencia
    });
    this.auditoriaFirmada = true;
    this.mostrarFirma = false;
    this.mensajeEstado = 'Auditoría firmada y finalizada correctamente.';
    this.router.navigate(['/gerente']);
  }

  cancelarFirma(): void {
    this.mostrarFirma = false;
    this.firmaConfirmada = false;
    this.errorMensaje = '';
  }
}