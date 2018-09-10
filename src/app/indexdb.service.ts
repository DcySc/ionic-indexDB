import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/internal/Subject';

@Injectable({
    providedIn: 'root'
})
export class IndexdbService {

    private tableName = 'test';

    private db;

    results = new Subject<any>();

    constructor() {
        this.initDB();

    }

    initDB() {
        const indexDB = window.indexedDB;
        const request = indexDB.open('test', 1);

        request.onerror = (e) => {
            // console.log(e.currentTarget.error.message);
        };

        request.onsuccess = (e) => {
            // 这里不能直接 this.db = e.target.result; TsLint会报错
            const target: any = e.target;
            this.db = target.result;

            this.db.onerror = (event) => {
                console.log(event.target.errorCode);
            };

            // 页面初始化的时候更新一下界面
            this.query();
        };

        request.onupgradeneeded = (e) => {
            const target: any = e.target;
            const db = target.result;

            if (db.objectStoreNames.contains(this.tableName)) return;

            // 如果表格不存在，创建一个新的表格（keyPath，主键 ； autoIncrement,是否自增），会返回一个对象（objectStore）
            const objectStore = db.createObjectStore('test', {keyPath: 'id', autoIncrement: true});

            // 指定可以被索引的字段，unique字段是否唯一
            objectStore.createIndex('name', 'name', {unique: false});
        };
    }

    insert(name) {
        const transaction = this.db.transaction([this.tableName], 'readwrite');
        transaction.oncomplete = (event) => {
            console.log('ALL Done');
        };
        transaction.onerror = (event) => {
            console.dir(event);
        };

        const objectStore = transaction.objectStore(this.tableName);
        // 添加数据
        objectStore.add({'name': name});
    }

    update(obj) {
        if (!this.db.objectStoreNames.contains(this.tableName)) return;

        const transaction = this.db.transaction([this.tableName], 'readwrite');
        transaction.oncomplete = (event) => {
            console.log('ALL Done');
        };
        transaction.onerror = (event) => {
            console.dir(event);
        };

        const objectStore = transaction.objectStore(this.tableName);
        const request = objectStore.get(obj.id);

        request.onsuccess = function (e) {

            let data = e.target.result;

            data = obj;

            objectStore.put(data);
        };
    }

    delete(id) {
        if (!this.db.objectStoreNames.contains(this.tableName)) return;

        const transaction = this.db.transaction([this.tableName], 'readwrite');
        transaction.oncomplete = (event) => {
            console.log('ALL Done');
        };
        transaction.onerror = (event) => {
            console.dir(event);
        };

        const objectStore = transaction.objectStore(this.tableName);

        objectStore.delete(id);
    }

    query() {
        if (!this.db.objectStoreNames.contains(this.tableName)) return;

        const transaction = this.db.transaction([this.tableName], 'readwrite');
        transaction.oncomplete = (event) => {
            console.log('ALL Done');
        };
        transaction.onerror = (event) => {
            console.dir(event);
        };

        const objectStore = transaction.objectStore(this.tableName);

        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                this.results.next(cursor.value);
                cursor.continue();
            } else {
                console.log('Done with cursor');
            }

        };
    }

}
