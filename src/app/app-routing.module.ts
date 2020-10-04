import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BattleshipComponent } from './battleship/battleship.component';

const routes: Routes = [{ path: '', component: BattleshipComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
