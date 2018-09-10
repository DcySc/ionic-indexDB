import {Component, OnInit} from '@angular/core';
import {IndexdbService} from '../indexdb.service';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
    thisId;

    results = [];

    console = [];

    constructor(
        private indexDBService: IndexdbService
    ) {
    }

    ngOnInit() {
        this.indexDBService.results.subscribe(it => this.results.push(it));
    }

    add(name) {
        if (name === '') return;
        this.indexDBService.insert(name);
        this.query();
    }

    query() {
        this.results = [];
        this.indexDBService.query();
    }

    delete(id) {
        this.indexDBService.delete(id);
        this.query();
    }

    clickName(id) {
        this.thisId = id;
    }

    upDate(name) {
        if (name === '') {
            this.thisId = '';
            return;
        }

        this.indexDBService.update({id: this.thisId, name: name});
        this.query();
        this.thisId = '';
    }

}
