import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-google-social-button',
  standalone: true,
  imports: [],
  templateUrl: './google-social-button.component.html',
  styleUrl: './google-social-button.component.scss'
})
export class GoogleSocialButtonComponent {
  readonly text = input<string>('Sign in with Google');
  readonly disabled = input<boolean>(false);
  readonly buttonClick = output<void>();

  handleClick(): void {
    if (!this.disabled()) {
      this.buttonClick.emit();
    }
  }
}
