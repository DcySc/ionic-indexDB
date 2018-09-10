## 说明

这篇文章主要说明: 在手机上中使用IndexDB对数据进行增删改查等基本操作的过程

## demo

#### 1.概述 

我们这个demo的流程大概是:

(1)进入app后, 从indexDB获取数据显示到界面上.

(2)在界面上可以进行添加,修改,删除等操作, 每次操作完成之后, 再对界面进行更新

#### 2.查询功能

我们使用IndexDB的查询完成获取数据的功能, 再将其渲染到界面上

(1)我们需要创建一个SQLite的service

    $ ionic g service indexdb   
    
(2)在我们查询之前, 我们得先有一个数据库, 所以这里写一个初始化数据库的方法, 并调用它

onupgradeneeded事件在第一次打开页面初始化数据库时会被调用，或在当有版本号变化时。所以，你应该在onupgradeneeded函数里创建你的存储数据。如果没有版本号变化，而且页面之前被打开过，你会获得一个onsuccess事件。

indexdb.service.ts:
    
    private db;// 保存数据库对象
    
    private tableName = 'test';// 我们创建的表的名称
    
    constructor() {
        // 初始化数据库
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

(4)现在我们就可以实现查询方法了, 这里我们将查询结果用一个变量results存储下来, 以便组件使用

IndexDB的查询是通过遍历cursor实现的
    
indexdb.service.ts:
    
    results = new Subject<any>(); // 储存查询结果, 由于查询是异步的, 所以使用Subject类型存储
    
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
    
(5) 现在我们就可以渲染数据了

(a)我们先导入sqlite.service.ts

home.page.ts
    
    import {IndexdbService} from '../indexdb.service';
    
    constructor(
        private indexDBService: IndexdbService
    ) {
    }
    
(b)订阅service的查询结果

home.page.ts

    results = []; // 存储查询结果
    
    ngOnInit() {
        this.indexDBService.results.subscribe(it => this.results.push(it));
    }
    
(c)渲染数据(scss在最后面), 之后会给name部分和图标添加事件

home.page.html

    <ion-content>        
        <div *ngIf="!results.length" class="null">你还没有数据</div>
    
        <ng-container *ngFor="let row of results">
            <div class="row">
                <div class="id">{{row.id}}</div>
                <div class="name">{{row.name}}</div>
                <div class="delete"><ion-icon slot="start" name="close"></ion-icon></div>
            </div>
        </ng-container>
    </ion-content> 
    
到此为止我们就完成查询功能了, 每次进入app都会查询一次, 并将数据渲染到界面上

#### 3.插入功能

我们不光要能查询还要可以在界面进行插入数据的操作

(1)首先, 我们在service里添加一个插入方法, indexDB的插入是通过objectStore的add方法实现的

indexdb.service.ts:

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
    
(2)然后, 我们得在界面上完成插入操作部分

home.page.html

    <ion-item>
        <ion-label position="floating">请输入需要添加的数据</ion-label>
        <ion-input type="text" maxlength="5" #data></ion-input>
        <button class="addBtn" (click)="add(data.value)">添加</button>
    </ion-item>
    
(3)我们再来完成add方法

home.page.ts

    add(name) {
        if (name === '') return;
        // 调用service的insert完成插入
        this.sqLiteService.insert(name);
    }
    
(4)插入之后, 我们还需要刷新一下界面

home.page.ts

    add(name) {
        if (name === '') return;
        // 调用service的insert完成插入
        this.sqLiteService.insert(name);
        // 重新查询一次, 完成刷新
        this.query();
    }
    
    query() {
        // 这里不清空的话, 会将上次的查询结果渲染出来
        this.results = [];
        this.sqLiteService.query();
    }
    
#### 4.删除功能

删除功能和插入功能的实现原理差不多

(1)在service实现删除方法, indexDB的插入是通过objectStore的delete方法实现的

indexdb.service.ts:

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
    
(2)然后, 我们得在界面上完成删除操作部分, 给我们之前的图标绑定删除事件

home.page.html

    <div class="delete" (click)="delete(row.id)"><ion-icon slot="start" name="close"></ion-icon></div>
    
(3)实现delete方法, 然后更新界面

home.page.ts

    delete(id) {
        this.sqLiteService.delete(id);
        this.query();
    }
    
#### 5.修改功能

修改功能, 原理同上

(1)在service实现修改方法,更新对象，首先要把它取出来(get方法)，修改，然后再放回去(put方法)

indexdb.service.ts:

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
    
(2)然后, 我们得在界面上完成修改操作部分, 给我们之前的name绑定事件显示alert框, 我们在alert框中完成修改操作

home.page.html

    <div class="name" (click)="clickName(row.id)">{{row.name}}</div>
    
    <div *ngIf="thisId" class="alert">
        <ion-item lines="full">
            <ion-label position="floating">请输入你的新名字</ion-label>
            <ion-input type="text" maxlength="5" #newData></ion-input>
            <button class="updateBtn" (click)="upDate(newData.value)">确定修改</button>
        </ion-item>
    </div>
    
(3)实现clickName和upDate方法, 然后更新界面

home.page.ts

    thisId; // 传递id值, 并控制alert框的显示隐藏
    
    clickName(id) {
        this.thisId = id;
    }
    
    upDate(name) {
        if (name === '') {
            his.thisId = '';
            return;
        }
    
        this.sqLiteService.update({id: this.thisId, name: name});
        this.query();
        this.thisId = '';
    }

#### 6.scss代码

    $height: 50px;
    
    .null {
        margin: 1em;
    }
    
    .row {
        display: flex;
        width: 250px;
        height: $height;
        border-radius: 10px;
        overflow: hidden;
        font-size: 20px;
        margin: 0.5em;
    
        .id {
            width: 50px;
            height: 100%;
            line-height: $height;
            background-color: #5F7D8C;
            text-align: center;
            color: white;
        }
    
    
        .name {
            flex-grow: 1;
            height: 100%;
            line-height: $height;
            background-color: #EEE;
            text-align: center;
        }
    
        .delete {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 50px;
            height: 100%;
    
            background-color: #5F7D8C;
            color: white;
            font-size:30px;
        }
    }
    
    ion-item {
        position: relative;
    
        .addBtn {
            position: absolute;
            right: 30px;
            bottom: 6px;
            width: 50px;
            height: 30px;
            background-color: #3f79e0;
            border-radius: 10px;
            color: white;
            outline: 0;
        }
    }
    
    .alert {
        position: fixed;
        top: 50px;
        left: 10%;
        background-color: whitesmoke;
        width: 80%;
    }
    
    .updateBtn {
        margin: 10px auto;
        height: 30px;
        width: 100px;
        background-color: #3f79e0;
        color: white;
        border-radius: 5px;
    }


至此, 我们就可以在手机上使用IndexDB了.

    