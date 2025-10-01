import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-facebook-social-button',
  standalone: true,
  imports: [],
  templateUrl: './facebook-social-button.component.html',
  styleUrl: './facebook-social-button.component.scss'
})
export class FacebookSocialButtonComponent {
  readonly text = input<string>('Connect Facebook');
  readonly disabled = input<boolean>(false);
  readonly buttonClick = output<void>();

  handleClick(): void {
    if (!this.disabled()) {
      this.buttonClick.emit();
    }
  }
}
