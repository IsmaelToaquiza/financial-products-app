import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackMessage } from './feedback-message';

describe('FeedbackMessage', () => {
  let fixture: ComponentFixture<FeedbackMessage>;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FeedbackMessage] });
    fixture = TestBed.createComponent(FeedbackMessage);
  });

  it('does not render an empty message', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.feedback')).toBeNull();
  });

  it.each([
    ['success', 'status'],
    ['error', 'alert'],
    ['info', 'status'],
  ])('renders a %s message with the appropriate role', (type, role) => {
    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('message', 'Resultado de la operación');
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.feedback');

    expect(message.textContent).toContain('Resultado de la operación');
    expect(message.classList.contains('feedback--' + type)).toBe(true);
    expect(message.getAttribute('role')).toBe(role);

    fixture.componentRef.setInput('message', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.feedback')).toBeNull();
  });

  it('renders messages as text, not HTML', () => {
    fixture.componentRef.setInput('message', '<img src=x onerror=alert(1)>');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('<img');
  });
});
