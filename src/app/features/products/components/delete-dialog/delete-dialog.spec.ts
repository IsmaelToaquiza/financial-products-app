import { TestBed } from '@angular/core/testing';
import { DeleteDialog } from './delete-dialog';

describe('DeleteDialog', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
    TestBed.configureTestingModule({ imports: [DeleteDialog] });
  });
  it('opens a modal, confirms, cancels and blocks escape while busy', () => {
    const f = TestBed.createComponent(DeleteDialog);
    f.componentRef.setInput('product', { name: 'Producto' });
    f.detectChanges();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    const confirm = jest.spyOn(f.componentInstance.confirmed, 'emit');
    const cancel = jest.spyOn(f.componentInstance.cancelled, 'emit');
    f.nativeElement.querySelectorAll('button')[1].click();
    expect(confirm).toHaveBeenCalled();
    f.nativeElement.querySelectorAll('button')[0].click();
    expect(cancel).toHaveBeenCalledTimes(1);
    const event = new Event('cancel', { cancelable: true });
    f.componentInstance.onCancel(event);
    expect(event.defaultPrevented).toBe(true);
    expect(cancel).toHaveBeenCalledTimes(2);
    f.componentRef.setInput('busy', true);
    f.detectChanges();
    f.componentInstance.onCancel(event);
    expect(cancel).toHaveBeenCalledTimes(2);
    f.destroy();
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});
