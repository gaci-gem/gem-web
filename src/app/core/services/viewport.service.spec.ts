import { TestBed } from '@angular/core/testing';
import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  it('should expose and update the mobile state from matchMedia', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const mediaQuery = {
      matches: false,
      addEventListener: jasmine.createSpy('addEventListener').and.callFake((_: string, callback: (event: MediaQueryListEvent) => void) => {
        listener = callback;
      }),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    } as unknown as MediaQueryList;
    spyOn(window, 'matchMedia').and.returnValue(mediaQuery);

    TestBed.configureTestingModule({ providers: [ViewportService] });
    const service = TestBed.inject(ViewportService);

    expect(service.isMobile()).toBeFalse();
    listener?.({ matches: true } as MediaQueryListEvent);
    expect(service.isMobile()).toBeTrue();

    TestBed.resetTestingModule();
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', listener!);
  });
});
