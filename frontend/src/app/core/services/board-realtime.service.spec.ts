import { TestBed } from '@angular/core/testing';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { BoardRealtimeService } from './board-realtime.service';
import { TokenStorageService } from './token-storage.service';

describe('BoardRealtimeService', () => {
  let service: BoardRealtimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BoardRealtimeService, TokenStorageService] });
    service = TestBed.inject(BoardRealtimeService);
  });

  it('joins, rejoins after reconnect and cleans handlers when leaving', async () => {
    let reconnectHandler: (() => Promise<void>) | undefined;
    const invoke = jasmine.createSpy('invoke').and.returnValue(Promise.resolve());
    const fakeConnection = {
      state: HubConnectionState.Disconnected,
      start: jasmine.createSpy('start').and.callFake(async () => { fakeConnection.state = HubConnectionState.Connected; }),
      stop: jasmine.createSpy('stop').and.callFake(async () => { fakeConnection.state = HubConnectionState.Disconnected; }),
      invoke,
      on: jasmine.createSpy('on'),
      off: jasmine.createSpy('off'),
      onreconnected: jasmine.createSpy('onreconnected').and.callFake((handler: () => Promise<void>) => { reconnectHandler = handler; })
    } as unknown as HubConnection & { state: HubConnectionState };
    spyOn(service as unknown as { buildConnection: () => HubConnection }, 'buildConnection').and.returnValue(fakeConnection);

    await service.joinBoard('project-1');
    expect(fakeConnection.start).toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledWith('JoinBoard', 'project-1');
    expect(fakeConnection.on).toHaveBeenCalledTimes(9);

    invoke.calls.reset();
    await reconnectHandler!();
    expect(invoke).toHaveBeenCalledWith('JoinBoard', 'project-1');

    await service.leaveBoard();
    expect(invoke).toHaveBeenCalledWith('LeaveBoard', 'project-1');
    expect(fakeConnection.off).toHaveBeenCalledTimes(9);
    expect(fakeConnection.stop).toHaveBeenCalled();
  });
});
