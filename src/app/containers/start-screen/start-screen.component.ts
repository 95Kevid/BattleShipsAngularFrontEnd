import { Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { PlayerService } from '../../services/player.service';
import { CreateGameRequest } from '../../models/create-game-request';
import { Store } from '@ngrx/store';
import { GameArenaParameterUpdate } from '../../store/game-arena/game-arena.actions';
import { PollingService } from '../../services/polling.service';
import {
  CreateGameRequestAction,
  CreatePlayerRequestAction,
  JoinGameRequestAction,
  LoadGameRequestAction,
  PlayerReadyRequestAction,
  PlayersToPlayersReadyPollAction,
  UpdateOrdersAction
} from '../../store/game/game.actions';
import { Observable } from 'rxjs';
import { AppState } from '../../store';
import { JoinGameRequest } from '../../models/join-game-request';
import { NavigationService } from '../../services/navigation.service';
import { LoadGameResponse } from '../../models/load-game-response';
import { GameArenaService } from '../../services/game-arena.service';
import { GameArenaParameters } from '../../models/game-arena-parameters';

@Component({
  selector: 'app-game-control',
  templateUrl: './start-screen.component.html',
  styleUrls: ['./start-screen.component.scss']
})
export class StartScreenComponent implements OnInit {
  private gameService: GameService;
  private createPlayerService: PlayerService;
  private navigationService: NavigationService;
  private gameArenaService: GameArenaService;
  private store: Store<AppState>;
  private pollingService: PollingService;
  private playersReady$: Observable<number>;
  private playersInGame$: Observable<number>;
  private gameId$: Observable<number>;
  private gameId: number;
  private playerId$: Observable<number>;
  private orders$: Observable<string>;

  constructor(
    gameService: GameService,
    createPlayerService: PlayerService,
    store: Store<AppState>,
    pollingService: PollingService,
    gameArenaService: GameArenaService,
    navigationService: NavigationService
  ) {
    this.gameService = gameService;
    this.createPlayerService = createPlayerService;
    this.store = store;
    this.pollingService = pollingService;
    this.gameArenaService = gameArenaService;
    this.navigationService = navigationService;
  }

  showGameCreationMenu = false;
  showPlayerCreationMenu = false;
  showJoinGameMenu = false;
  showShipPlacerMenu = false;
  showGrid = false;
  showLoadGameMenu = false;

  ngOnInit() {
    console.log('Game control component init');
    this.gameId$ = this.store.select(state => state.gameState.gameId);
    this.playerId$ = this.store.select(state => state.gameState.playerId);
    this.playersInGame$ = this.store.select(
      state => state.gameState.numberOfPlayersInGame
    );
    this.playersReady$ = this.store.select(
      state => state.gameState.playersReady
    );
    this.orders$ = this.store.select(state => state.gameState.currentOrders);
    this.gameService.allPlayersReady().subscribe((result: boolean) => {
      if (result) {
        console.log('Navigate to shooting screen');
        this.navigationService.navigate('/shooting');
      }
    });
  }

  createGameButtonClicked() {
    this.showGameCreationMenu = true;
    this.store.dispatch(
      new UpdateOrdersAction(
        'Enter number of players and the size of the game game-arena (6 - 26)'
      )
    );
  }

  joinGameButtonClicked() {
    this.showJoinGameMenu = true;
  }

  createGame(createGameRequest: CreateGameRequest) {
    this.showPlayerCreationMenu = true;
    this.store.dispatch(new CreateGameRequestAction(createGameRequest));
    this.store.dispatch(new UpdateOrdersAction('Enter the your name.'));
    this.gameId$.subscribe(state => (this.gameId = state));
  }

  createPlayer(playerName: string) {
    this.store.dispatch(
      new CreatePlayerRequestAction({
        gameId: this.gameId,
        playerName: playerName
      })
    );
    this.showShipPlacerMenu = true;
    this.showGrid = true;
    this.store.dispatch(
      new UpdateOrdersAction('Place your ships and click start.')
    );
  }

  pollForPlayersToPlayersReady() {
    this.store.dispatch(new PlayersToPlayersReadyPollAction(this.gameId));
  }

  readyToStartGame() {
    let playerId: number;
    this.playerId$.subscribe(pid => (playerId = pid));
    this.store.dispatch(new PlayerReadyRequestAction(playerId));
    this.store.dispatch(
      new UpdateOrdersAction('Await other players to join...')
    );
  }

  joinGame(joinGameRequest: JoinGameRequest) {
    this.gameId$.subscribe(state => (this.gameId = state));
    this.store.dispatch(new JoinGameRequestAction(joinGameRequest));
    this.showShipPlacerMenu = true;
  }

  loadGame(loadGameRequest: LoadGameResponse) {
    this.store.dispatch(new LoadGameRequestAction(loadGameRequest));
  }

  loadGameButtonClicked() {
    this.showLoadGameMenu = true;
  }
}
