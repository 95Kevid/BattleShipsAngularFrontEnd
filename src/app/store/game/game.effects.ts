import { Injectable } from '@angular/core';
import { GameService } from '../../services/game.service';
import { Effect, ofType, Actions } from '@ngrx/effects';
import {
  CreateGameRequestAction,
  CreatePlayerRequestAction,
  GameCreatedAction,
  GameStatusRequestAction,
  GameStatusRequestSuccessAction,
  JoinGameAction,
  JoinGameRequestAction, LoadGameRequestAction,
  PlayerCreatedAction,
  PlayerReadyRequestAction,
  PlayerReadyRequestFailAction,
  PlayerReadySuccessAction,
  PlayersToPlayersReadyPollAction,
  PlayersToPlayersReadyPollSuccessAction,
  ShootRequestAction,
  ShootRequestFailAction,
  ShootRequestSuccessAction
} from './game.actions';
import {catchError, map, mergeMap, switchMap, tap} from 'rxjs/operators';
import { PollingService } from '../../services/polling.service';
import { PlayerService } from '../../services/player.service';
import { of } from 'rxjs';
import { InitialiseGameArena, RenderHitPosition } from '../game-arena/game-arena.actions';
import {NavigationService} from '../../services/navigation.service';
import {GetThisPlayersInfoService} from '../../services/get-this-players-info.service';
import { GameArenaService } from '../../services/game-arena.service';


export var thisPlayerId: number;

@Injectable()
export class GameEffects {
  constructor(
    private actions$: Actions,
    private gameService: GameService,
    private pollingService: PollingService,
    private playerService: PlayerService,
    private gameArenaService: GameArenaService,
    private navigationService: NavigationService
  ) {}

  @Effect()
  public requestPlayersToPlayersReady$ = this.actions$.pipe(
    ofType<PlayersToPlayersReadyPollAction>('PLAYERS_TO_PLAYERS_READY_REQUEST'),
    switchMap(action => this.pollingService.pollToStartGame(action.payload)),
    map(
      playersToPlayersReady =>
        new PlayersToPlayersReadyPollSuccessAction(playersToPlayersReady)
    )
  );

  @Effect()
  public createGameRequest$ = this.actions$.pipe(
    ofType<CreateGameRequestAction>('CREATE_GAME'),
    map(action => action.payload),
    switchMap(createGameRequest =>
      this.gameService.createGame(createGameRequest)
    ),
    mergeMap(createGameResponse => [
      new GameCreatedAction(createGameResponse.gameId),
      new InitialiseGameArena(createGameResponse.gameArenaSize)
    ])
  );

  @Effect()
  public joinGameRequest$ = this.actions$.pipe(
    ofType<JoinGameRequestAction>('JOIN_GAME_REQUEST'),
    map(action => action.payload),
    switchMap(joinGameRequest =>
      this.gameService.joinGame(joinGameRequest)
    ),
    mergeMap(joinGameResponse => [
        new InitialiseGameArena(joinGameResponse.gridSize),
        new JoinGameAction(joinGameResponse)
       ])
  );

 @Effect()
  public createPlayerRequest$ = this.actions$.pipe(
    ofType<CreatePlayerRequestAction>('CREATE_PLAYER'),
    map(action => action.payload),
    switchMap(createPlayerRequest =>
      this.playerService.createPlayer(createPlayerRequest)
    ),
    map(playerId => new PlayerCreatedAction(playerId))
  );

  @Effect()
  public readyToGameRequest$ = this.actions$.pipe(
    ofType<PlayerReadyRequestAction>('PLAYER_READY'),
    map(action => action.payload),
    switchMap(playerId => this.playerService.playerReady(playerId).pipe(
    map(_ => new PlayerReadySuccessAction()),
    catchError(err => of(new PlayerReadyRequestFailAction(err.toString())))))
  );

  @Effect()
  public gameStatusRequest$ = this.actions$.pipe(
    ofType<GameStatusRequestAction>('GAME_STATUS_REQUEST'),
    switchMap(action => {
      thisPlayerId = action.payload.playerId;
      return this.pollingService.pollForGameStatus(action.payload);
    }),
    mergeMap(gameStatusResponse => {
        const getThisPlayersInfoService: GetThisPlayersInfoService = new GetThisPlayersInfoService();
        const playerInGameInfo = getThisPlayersInfoService.getPlayerInfo(thisPlayerId, gameStatusResponse.playerInGameInfos)
        return [
          new GameStatusRequestSuccessAction(gameStatusResponse),
          new RenderHitPosition(playerInGameInfo)];
      }
    )
  )

  @Effect()
  public shootRequest$ = this.actions$.pipe(
    ofType<ShootRequestAction>('SHOOT_REQUEST'),
    map(action => {console.log('Shoot request called.'); return action.payload}),
    switchMap(shootRequest => this.gameService.shootRequest(shootRequest).pipe(
    map(_ => new ShootRequestSuccessAction()),
    catchError(err => of(new ShootRequestFailAction(err.toString())))))
  );

  // @Effect()
  // public loadGameRequest$ = this.actions$.pipe(
  //   ofType<LoadGameRequestAction>('LOAD_GAME_REQUEST'),
  //   map(action => {console.log('Load Request called.'); return action.payload}),
  //   switchMap(loadGameRequest => this.gameService.loadGame(loadGameRequest).pipe(
  //     map(_ => new ShootRequestSuccessAction()),
  //     catchError(err => of(new ShootRequestFailAction(err.toString())))))
  // );

  // @Effect()
  // public winnerFoundNavigate$ = this.actions$.pipe(
  //   ofType<WinnerFoundNavigateAction>('WINNER_FOUND_NAVIGATE'),
  //   map(action => {
  //     // this.navigationService.navigate('/winner-screen');
  //     return new LoserSaveAction(action.payload);
  //   }
  // ));
}
