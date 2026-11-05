import { Directive, HostListener, ElementRef, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatarTelefoneBR } from '../pipes/telefone.pipe';

@Directive({
  selector: '[appPhoneMask]',
  standalone: true
})
export class PhoneMaskDirective {

  constructor(
    private el: ElementRef, 
    @Optional() private control: NgControl | null
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement as HTMLInputElement;
    const formatado = formatarTelefoneBR(input.value);

    input.value = formatado;
    if (this.control && this.control.control) {
      this.control.control.setValue(formatado, { emitEvent: false });
    }
  }
}

