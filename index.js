var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port_server = 3050;

server.listen(port_server, function () {
    console.log('>>>> ServerNODE messages||(SERVER STARTED)|| port: ' + port_server);
});

app.get('/1', function (request, respons) {
    respons.sendFile(__dirname + '/pages/user01.html');
});

app.get('/2', function (request, respons) {
    respons.sendFile(__dirname + '/pages/user02.html');
});

app.get('/3', function (request, respons) {
    respons.sendFile(__dirname + '/pages/user03.html');
});


var users = []; // массив с данными пользователе и их сокетами
io.on('connection', function (socket) {

    socket.on('i_am', function (data) {
        /** label - метка по которой определяем старого и нового пользователя
         *  если значение - 0, то создаем новый массив в users
         *  если значение - 1, то обновляем данные в массиве users
         */
        var label = 0;
        var index_user_in_base = ''; // индекс пользователя в массиве users, используется только при обновлении массива
        var mass_id = [];
        var index_socket = '';

        users.some(function (value) {
            if (data == value['name']) {
                label = 1;
                return label;
            }
        }); /** массив users с зарегестрированными пользователями, проверяем есть ли пользователь */


        if (label == 0) {
            // исполняем если пользователь не найден, создаем под него массив

            /** структура массива users
            *   users > [0] > ['name'] = Логин пользователя
            *               > ['mass_id'] > [0] > ['date'] = Дата добавления ID
             *                                  > ['key']  = Ключ проверки
            *                                   > ['id']   = ID сокета
            */
            var newData = {'date': Date.now(), 'id': socket['id']};
            mass_id.push(newData);

            users.push({
                'name': data,
                'key' : '',
                'mass_id' : mass_id
            });
            /** выводим в консоль данные о новом пользователе */
            console.log('>>>> ServerNODE messages||(New user connected)|| New login: '+ data + ', Socket: ' + socket['id']);
        } else {
            // исполняем если пользователь был в массиве, обновляем данные о нем
            users.some(function (value, index) {
                if (data == value['name']) {
                    index_user_in_base = index; // назначаем index_user_in_base(с этого момента знаем индек пользователя в users)
                    return;
                }
            });
            mass_id = users[index_user_in_base]['mass_id'];
            var newData = {'date': Date.now(), 'id': socket['id']};
            mass_id.push(newData);

            users[index_user_in_base]['mass_id'] = mass_id;

            /** выводим в консоль данные о старом пользователе */
            console.log('>>>> ServerNODE messages||(Update user connected)|| Old login: '+ data + ', Socket: ' + socket['id'] + ', INDX: ' + index_user_in_base);
        }


        socket.on('disconnect', function(){
            users.some(function (value, index) {
                if (data == value['name']) {
                    index_user_in_base = index; // назначаем index_user_in_base(с этого момента знаем индек пользователя в users)
                    return;
                }
            });

            users[index_user_in_base]['mass_id'].some(function (value, index){
                if (value['id'] == socket['id']){
                    index_socket = index;
                }
            });

            users[index_user_in_base]['mass_id'].splice(index_socket, 1);

            if(users[index_user_in_base]['mass_id'].length == 0){
                users.splice(index_user_in_base, 1);
                console.log('>>>> ServerNODE messages||(All socket closed)|| login: '+ data);
            }

           // users.splice(index_user_in_base, 1); // удаляет в массиве users пользователя по индексу. (первый элемент - это индекс с которого начать, второе - сколько значений удалить) НО!!! сдвигает массив по индексам
           // delete users[index_user_in_base]; // удаляет в массиве users пользователя по индексу. НО!!! на место удаленного массива падает undefined

            console.log('>>>> ServerNODE messages||(Delete user)|| login: ' + data + ', INDX: ' + index_user_in_base);
        }); // при включении этой функции теперь только удаляет в users, не обновляет его(ДАННАЯ ФУНКЦИЯ ДОЛЖНА БЫТЬ ОТДЕЛЬНО).



        console.log(' ');
        console.log('>>ARRAY USERS>> ServerNODE messages||(Data in base users)||:');
        users.forEach(function (value, index) {
                console.log('INDX: ' + index + ', login: ' + value['name']);
                var data_all_id = value['mass_id'];

                     data_all_id.forEach(function (value1, index1) {
                         console.log('    INDX_ID: ' + index1 + ', date: ' + value1['date'] + ', id: ' + value1['id']);
                     })

        }) /** вывод в консоль данных о массиве пользователей */
        console.log(' ');

    })

    socket.on('new_mess', function (user, messages) {
        // перебираем массив users и ищем совпадение, далее проверяем существует ли сохраненный сокет,
        // если - да, то отправляем данные по id сокета

        users.some(function (value, index) {
            if (user == value['name']) {
                var index_user = index;
                var all_id_user = users[index_user]['mass_id'];

                all_id_user.forEach(function (value1) {
                    if (io.sockets.connected[value1['id']]) {
                        io.sockets.connected[value1['id']].emit('messages', messages);
                        console.log('отправили: ' + messages);
                    }
                });
             return;
            }
        })
    }) /** отправка данных конкретному пользователю */

});

