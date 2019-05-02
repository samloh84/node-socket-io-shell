const http = require('http');
const nodePath = require('path');
const child_process = require('child_process');
const os = require('os');

const _ = require('lodash');
const socket_io = require('socket.io');
const express = require('express');

const app = express();
const server = http.createServer(app);

const io = socket_io(server);

const shell_command = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

app.use(express.static(nodePath.resolve(process.cwd(), 'static')));

io.on('connection', function (socket) {

    console.log('user connected');

    let shell = child_process.spawn(shell_command, {
        stdio: 'pipe',
        detached: true,
        env: _.merge({}, process.env, {LANG: 'C.UTF-8'})
    });

    shell.on('error', function (err) {
        console.error(err.stack);
        process.exit(1);
    });

    shell.stdout.on('data', function (data) {
        data = data.toString('utf8');
        console.log(`stdout: ${data}`);
        socket.emit('stdout', data);
    });
    shell.stderr.on('data', function (data) {
        data = data.toString('utf8');
        console.error(`stderr: ${data}`);
        socket.emit('stderr', data.toString('utf8'));
    });

    shell.on('close', function (code) {
        console.log(`shell exited with code ${code}`);
        socket.emit('stdout', `shell exited with code ${code}`)
    });

    socket.on('command', function (data) {
        console.log(`stdin: ${data}`);
        shell.stdin.write(data + (!data.endsWith('\n') ? '\n' : ''));
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
        shell.kill();
    })

});


app.listen(3000, function () {
    console.log('Listening on port 3000');
});
