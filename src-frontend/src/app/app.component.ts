import {AfterViewInit, Component, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {ExtensionService} from './classes/extension.service';
import {Card, CardOutput} from 'vscode-ipe-types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  cards: Card[] = [
    new Card(0, 'sample card', 'print("Hello, world!");', [new CardOutput('text/plain', 'Hello, world!')])
  ];

  selectedCards: number[] = [];
  visibleCards = new Map<Card,boolean>();

  searchQuery = '';
  sortQuery = 'Oldest';
  typeQuery = {
    text: true,
    rich: true,
    error: true
  };
  ngOnInit() {
    //Intialize map, display all cards
    for (let card of this.cards) {
      this.visibleCards.set(card, true);
    }
  }
  /* Searching */
  cardMatchesSearchQuery(card: Card): boolean {
    if (this.searchQuery === '') { return true; }
    if (card.title.search(new RegExp(this.searchQuery, "i")) > -1) { return true; }
    if (card.sourceCode.search(new RegExp(this.searchQuery, "i")) > -1) { return true; }
    return false;
  }

  /* Type Filtering called via emitter in toolbar*/
  toggleTypeQuery(typeStr: string): void {
    this.typeQuery[typeStr] = !this.typeQuery[typeStr];
    for (let card of this.cards){
      this.visibleCards.set(card,this.cardMatchesFilter(card));
    }

  }

  cardMatchesFilter(card: Card): boolean {
    if (!this.typeQuery.text && !this.typeQuery.rich && !this.typeQuery.error) return true;
    if (card.outputs.length === 0) return true;

    for (let i = 0; i < card.outputs.length; i++) {
      if (this.typeQuery.text && card.outputs[i].type.indexOf('text/html') === -1) {
        if (card.outputs[i].type.indexOf('text') > -1) return true;
        if (card.outputs[i].type.indexOf('stdout') > -1) return true;
      }
      else if (this.typeQuery.error) {
        if (card.outputs[i].type.indexOf('error') > -1) return true;
      }
      else if (this.typeQuery.rich) {
        if (card.outputs[i].type.indexOf('image') > -1) return true;
        if (card.outputs[i].type.indexOf('application') > -1) return true;
        if (card.outputs[i].type.indexOf('text/html') > -1) return true;
      }
    }
    return false;
  }

  /* Sorting */
  onSort(): void {
    if (this.sortQuery === 'Oldest'){
      this.cards.sort(function(a, b) { return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0); } );
    } else if (this.sortQuery === 'Newest') {
      this.cards.sort(function(a, b) { return (a.id > b.id) ? -1 : ((b.id > a.id) ? 1 : 0); } );
    } else if (this.sortQuery === 'Alphabetical: A-Z') {
      this.cards.sort(function(a, b) { return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0); } );
    } else if (this.sortQuery === 'Alphabetical: Z-A') {
      this.cards.sort(function(a, b) { return (a.title > b.title) ? -1 : ((b.title > a.title) ? 1 : 0); } );
    }
  }

  /* Selecting */ //will remove/add element if it's in/not_in array
  onSelect(id: number): void {
    const index: number = this.selectedCards.indexOf(id, 1);
    if (index > -1) { this.selectedCards.splice(index);
    } else { this.selectedCards.push(id); }
  }

  /* Ordering */
  onMove({dir: direction, card: card}): void {
    if(direction === "up") this.moveUp(card);
    else if (direction ==="down") this.moveDown(card);
  }

  moveUp(card: Card): void {
    const index: number = this.cards.indexOf(card, 1);
    if (index > -1){
      const tmp: Card = this.cards[index - 1];
      this.cards[index - 1] = this.cards[index];
      this.cards[index] = tmp;
      this.sortQuery = 'Custom';
    }
  }

  moveDown(card: Card): void {
    const index: number = this.cards.indexOf(card);
    if (index > -1 && index < this.cards.length - 1){
      const tmp: Card = this.cards[index + 1];
      this.cards[index + 1] = this.cards[index];
      this.cards[index] = tmp;
      this.sortQuery = 'Custom';
    }
  }

  onDelete(card: Card): void {
    const index: number = this.cards.indexOf(card);
    if (index > -1) { this.cards.splice(index, 1); }
  }

  constructor(private extension: ExtensionService) {
    extension.onAddCard.subscribe(card => {
      this.cards.push(card);
       this.onSort();
    });
  }

  /* this code ensures that the list always scrolls to the bottom when new elements are added */
  @ViewChildren('listItems') listItems: QueryList<any>;
  @ViewChild('scrollingList') scrollContainer;
  ngAfterViewInit() {
    this.listItems.changes.subscribe(() => this.scrollToBottom());
    this.scrollToBottom();
  }
  scrollToBottom() {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
