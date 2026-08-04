import { Injectable, inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { appConfig } from '../config/app-config';
import { TokenStorageService } from './token-storage.service';

export type BoardRealtimeEventType =
  | 'TaskCreated'
  | 'TaskUpdated'
  | 'TaskDeleted'
  | 'TaskMoved'
  | 'TasksReordered'
  | 'ColumnCreated'
  | 'ColumnUpdated'
  | 'ColumnDeleted'
  | 'ColumnsReordered';

export interface BoardRealtimeEvent<T = unknown> {
  projectId: string;
  resourceId: string | null;
  eventType: BoardRealtimeEventType;
  timestamp: string;
  state: T;
}

const EVENT_TYPES: BoardRealtimeEventType[] = [
  'TaskCreated', 'TaskUpdated', 'TaskDeleted', 'TaskMoved', 'TasksReordered',
  'ColumnCreated', 'ColumnUpdated', 'ColumnDeleted', 'ColumnsReordered'
];

@Injectable({ providedIn: 'root' })
export class BoardRealtimeService {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly eventsSubject = new Subject<BoardRealtimeEvent>();
  private connection: HubConnection | null = null;
  private activeProjectId: string | null = null;
  private registeredHandlers = new Map<BoardRealtimeEventType, (...args: unknown[]) => void>();

  readonly events$: Observable<BoardRealtimeEvent> = this.eventsSubject.asObservable();

  async joinBoard(projectId: string): Promise<void> {
    if (this.activeProjectId === projectId && this.connection?.state === HubConnectionState.Connected) {
      return;
    }

    await this.leaveBoard();
    const connection = this.buildConnection();

    this.connection = connection;
    this.activeProjectId = projectId;
    this.registerHandlers(connection);
    connection.onreconnected(async () => {
      if (this.connection === connection && this.activeProjectId === projectId) {
        await connection.invoke('JoinBoard', projectId);
      }
    });

    try {
      await connection.start();
      await connection.invoke('JoinBoard', projectId);
    } catch (error) {
      await this.leaveBoard();
      throw error;
    }
  }

  async leaveBoard(): Promise<void> {
    const connection = this.connection;
    const projectId = this.activeProjectId;
    this.connection = null;
    this.activeProjectId = null;

    if (!connection) {
      return;
    }

    this.removeHandlers(connection);
    if (projectId && connection.state === HubConnectionState.Connected) {
      try {
        await connection.invoke('LeaveBoard', projectId);
      } catch {
        // The connection may already be closing; stopping it is still required.
      }
    }

    await connection.stop();
  }

  private registerHandlers(connection: HubConnection): void {
    for (const eventType of EVENT_TYPES) {
      const handler = (payload: unknown): void => {
        this.eventsSubject.next(payload as BoardRealtimeEvent);
      };
      this.registeredHandlers.set(eventType, handler);
      connection.on(eventType, handler);
    }
  }

  private removeHandlers(connection: HubConnection): void {
    for (const eventType of EVENT_TYPES) {
      const handler = this.registeredHandlers.get(eventType);
      if (handler) {
        connection.off(eventType, handler);
      }
    }

    this.registeredHandlers.clear();
  }

  private buildConnection(): HubConnection {
    return new HubConnectionBuilder()
      .withUrl(appConfig.boardHubUrl, {
        accessTokenFactory: () => this.tokenStorage.getToken() ?? ''
      })
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000])
      .configureLogging(LogLevel.Warning)
      .build();
  }
}
