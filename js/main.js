window.onload = function () {
    let sessionData = loadSessionData();
    loadUserData(sessionData.username, sessionData.chatname);
    let stateTab = {
        isTabLeave: false,
        newMessageCount: 0,
        logOut: false
    };
    logOutListener(stateTab);
    roomLinkCopyListener(sessionData);
    windowBlurFocusListener(stateTab);
    getAllMessage(sessionData, stateTab);
    sendMessageListener(sessionData);
 }

class Message {
    constructor(options) {
        this._elem;

        this.template = options.template;
        this.username = options.username;
        this.text = options.text;
        this.time = options.time;
        this.usernameFromToken = options.usernameFromToken;
    }
    render() {
        var html = this.template(getContext(this));
        this._elem = html;

        function getContext(self) {
            let messageType = getMessageType(self);
            let nickname = self.username;
            let dateObj = new Date(self.time*1000);
            let time = `${formatDateTime(dateObj.getHours())}:${formatDateTime(dateObj.getMinutes())}`;
            let date = `${formatDateTime(dateObj.getDate())}.${formatDateTime(dateObj.getMonth()+1)}.${formatDateTime(dateObj.getFullYear())}`;
            let text = self.text;
    
            return {
                messageType,
                nickname,
                date,
                time,
                text,
            };
        }
        function getMessageType(self) {
            return (self.usernameFromToken ===  self.username) ? "sent" : "accept";
        }
        function formatDateTime(value) {
            return ('0' + value).slice(-2);
        }
    }
    getElem() {
        if (!this._elem) this.render();
        return this._elem;
    }
}

class SmoothAnimation {
    constructor(options) {
        this._options = options; 

        if (this._options.isEsaeOut) {
            this._options.timing = makeEaseOut(this._options.timing);
        }

        function makeEaseOut(timing) {
            return function(timeFraction) {
                return 1 - timing(1 - timeFraction);
            }
        }
    }
    animate(draw) {
        var start = performance.now();
        let self = this;
        requestAnimationFrame(function animate(time) {
            var timeFraction = (time - start) / self._options.duration;
            if (timeFraction > 1) timeFraction = 1;
        
            var progress = self._options.timing(timeFraction)
            draw(progress);
            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            }
        });
    }
}

function sendMEssageToServer(messageText, sessionData){
    let formData = new FormData();
    formData.append("text", messageText.value);

    let headers = new Headers();
    headers.append("X-AUTH-TOKEN", sessionData.token)

    fetch(SettingController.getUrl()+"api/message/"+sessionData.key, {
        method: "POST", 
        headers, 
        body: formData})

    messageText.value = "";
}

function showMissedMessage(state){
    state.newMessageCount++;
    if (state.isTabLeave) {
        document.title = `anonymchat (${state.newMessageCount} сообщений)`;
    } else {
        document.title = `anonymchat`;
        state.newMessageCount = 0;
    }
}

function getNewMessage(sessionData, lastMessageTime, messageList, template, state) {

    let headers = new Headers();
    headers.append("X-AUTH-TOKEN", sessionData.token)

    fetch(SettingController.getUrl()+"api/message/"+sessionData.key, {
        method: "GET",
        headers})
        .then( response => response.json(), 
                reject => {
                    if (state.islogOut == true) {
                        return;
                    } else {
                        console.log(`Возникла ошибка: ${reject}`);
                    }
                })
        .then( responJson => {
            try{
                function circ(timeFraction) {
                    return 1 - Math.sin(Math.acos(timeFraction))
                }
                let smoothAnim = new SmoothAnimation({
                    duration: 300,
                    timing: circ,
                    isEsaeOut: true
                })

                let lastItem = responJson[responJson.length-1];

                if (lastMessageTime != lastItem.id) {
                    let message = new Message({
                        template: template,
                        username: lastItem.author,
                        text: lastItem.text,
                        time: lastItem.timecreated ,
                        usernameFromToken: sessionData.username,
                    });

                    lastMessageTime = lastItem.id;

                    messageList.insertAdjacentHTML("beforeEnd", message.getElem());

                    let from = messageList.scrollTop; 
                    let to = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;
                    smoothAnim.animate(function(progress) {
                            progress = isNaN(progress) ? 0 : progress;
                            messageList.scrollTop = from + to * progress ;
                        });

                    showMissedMessage(state);
                }
            } catch (e) {
                if (e.name !== "TypeError")
                    alert(e);
            }
            getNewMessage(sessionData, lastMessageTime, messageList, template, state);
        })
}

function getAllMessage(sessionData, state) {
    var source = document.getElementById("entry-template").innerHTML;
    var template = Handlebars.compile(source);

    let messageList = document.querySelector(".message-list");
    let lastMessageTime;

    let headers = new Headers();
    headers.append("X-AUTH-TOKEN", sessionData.token)

    fetch(SettingController.getUrl()+"api/message/"+sessionData.key, {
        method: "GET", 
        headers})
        .then( response => response.json())
        .then( responJson => {
            responJson.forEach(item => {
                let message = new Message({
                    template: template,
                    username: item.author,
                    text: item.text,
                    time: item.timecreated ,
                    usernameFromToken: sessionStorage.getItem("username"),
                });

                lastMessageTime = item.id;

                messageList.insertAdjacentHTML("beforeEnd", message.getElem());
                messageList.scrollTop  = messageList.scrollHeight;
            });

            getNewMessage(sessionData, lastMessageTime, messageList, template, state);
        });

}

function loadSessionData() {
    let sessionToken = window.sessionStorage.getItem('token');
    if (sessionToken == null) {
        window.location = "login.html";
        return;
    }
    let sessionKey = window.sessionStorage.getItem('key');
    let sessionUsername = window.sessionStorage.getItem('username');
    let sessionChatname = window.sessionStorage.getItem('chatname');
    let sessionChatlink = window.sessionStorage.getItem('chatlink');

    return {
        token:  sessionToken,
        key:  sessionKey,
        username: sessionUsername,
        chatname: sessionChatname,
        chatlink: sessionChatlink
    }
}

function loadUserData(username, chatname) {
    let profileName =  document.querySelector(".nav-item.profile");
    profileName.textContent = username;

    let tabItem =  document.querySelector(".tab-item");
    tabItem.textContent = chatname;
}

function logOutListener(state) {
    let logOut = document.querySelector(".nav-item.log-out");
    logOut.addEventListener("click", function() {
        state.islogOut = true;
        window.sessionStorage.clear();
        window.location.reload();
    });
}

function roomLinkCopyListener(sessionData) {
    let tabItem = document.querySelector(".tab-item");
    tabItem.addEventListener("click", function() {
        navigator.clipboard.writeText(sessionData.chatlink)
        .then(() => {
            alert("Ссылка на комнату успешно скопирована")
        })
        .catch(err => {
          console.log('Произошёл сбой при копировании ссылки на комнату', err);
        });
    });
}

function windowBlurFocusListener(state) {
    window.addEventListener("blur", () => state.isTabLeave = "true");
    window.addEventListener("focus", () => {
            document.title = "anonymchat";
            state.newMessageCount = 0;
            state.isTabLeave = false;
        });
}

function sendMessageListener(sessionData) {
    let messageText = document.querySelector(".message-text");
    let sendMessage = document.querySelector(".send-message");

    messageText.addEventListener("keydown", (event) => {
        if (event.keyCode === 13) {
            sendMEssageToServer(messageText, sessionData);
        }
    });
    sendMessage.addEventListener("click",  (event) => sendMEssageToServer(messageText, sessionData) );
}

