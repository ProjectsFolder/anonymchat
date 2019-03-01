async function createChat(value) {
    let responJson = await fetch(SettingController.getUrl()+"api/chat/create/"+value, {method: "POST"});
    let json = await responJson.json();
    return json;
}

async function checkExistChat(key) {
    let responJson = await fetch(SettingController.getUrl()+"api/chat/exists/"+key, {method: "GET"});
    let json = await responJson.json();
    return json;
}

async function loginChat(key, data) {
    let responJson = await fetch(SettingController.getUrl()+"api/user/login/"+key, {method: "POST", body: data});
    
    if (responJson.ok) {
        let json = await responJson.json();
        return json;
    } else {
        throw new Error(responJson.status +  ": " + responJson.statusText);
    }
}

let LoginStatusEnum = {
        CREATE_ROOM: 0,
        CHECK_LOGIN_ROOM: 1,
        LOGIN_SUCCESS: 2
    }

class LoginChatForm {
    constructor() {
        this.state1 = new InputRoomState(this);
        this.state2 = new InputUserState(this);
        this.state3 = new InputLinkState(this);

        this.roomname = "";
        this.username = "";
        this.linkchat = "";

        this._setInputAccessibility = function (state){
            let loginChatForm = document.getElementsByName("loginChat")[0];
            loginChatForm.roomName.disabled = state.roomnameIsDisabled;
            loginChatForm.userName.disabled = state.usernameIsDisabled;
            loginChatForm.roomLink.disabled = state.roomlinkIsDisabled;
        }

        this.currentState = this.state1;
        this._setInputAccessibility(this.state1);
    }

    setState(state){
        this.currentState = state;
        this._setInputAccessibility(state);
    }
    inputRoom() {
        this.currentState.inputRoom();
    }
    inputUsername() {
        this.currentState.inputUser();
    }
    inputLink() {
        this.currentState.inputLink();
    }
    startChat() {
        window.location.replace("index.html");
    }
}
    

class ChatStateBase{
	constructor(chat){
        this.chat = chat;
	}
	inputRoom(){
		throw new Exception();
	}
	inputUser(){
		throw new Exception();
	}
	inputLink(){
		throw new Exception();
	}
}

/**
 * Состояние ввода комнаты
 */
class InputRoomState extends ChatStateBase{
    constructor(chat){
        super(chat);
        this.roomnameIsDisabled = false;
        this.usernameIsDisabled = true;
        this.roomlinkIsDisabled = true;

        this._checkExistChatSuccess = function(responJson, loginChatForm) {
            loginChatForm.userName.focus();
            // loginChatForm.nextButton.disabled = true;
    
            sessionStorage.setItem('key', responJson.key);
            sessionStorage.setItem('chatname', responJson.name);
        }
	}
	inputRoom(){
        let loginChatForm = document.getElementsByName("loginChat")[0];
        let newRoomName = loginChatForm.roomName.value;

        this.chat.roomname = newRoomName;

        createChat(newRoomName)
                    .then(result => {
                        this._checkExistChatSuccess(result, loginChatForm);
                        this.chat.setState(this.chat.state2);
                    });
    }
}

/**
 * Состояние ввода пользователя
 */
class InputUserState extends ChatStateBase{
    constructor(chat){
        super(chat);
        this.roomnameIsDisabled = true;
        this.usernameIsDisabled = false;
        this.roomlinkIsDisabled = true;

        this._loginChatSuccess = function (responJson, loginChatForm){
            loginChatForm.roomLink.focus();
    
            sessionStorage.setItem('username', responJson.username);
            sessionStorage.setItem('token', responJson.token);
            sessionStorage.setItem('chatlink', loginChatForm.roomLink.value);


            let key = null;
            if(key==null) {
                key = sessionStorage.getItem('key');
                loginChatForm.roomLink.value = url+"?key="+key;
            } else {
                loginChatForm.roomLink.value = url;
            }
        }
    }
	inputUser(){
        let loginChatForm = document.getElementsByName("loginChat")[0];
        let newUsername = loginChatForm.userName.value;
  
        this.chat.username = newUsername;

        let data = new FormData();
        data.append("name", newUsername);
        loginChat(sessionStorage.getItem("key"), data)
            .then(result => {
                this._loginChatSuccess(result,loginChatForm);
                this.chat.setState(this.chat.state3);

            }, reject => {
                alert(reject);   
            });
	}
}

/**
 * Состояние ввода ссылки
 */
class InputLinkState extends ChatStateBase{
    constructor(chat){
        super(chat);
        this.roomnameIsDisabled = true;
        this.usernameIsDisabled = true;
        this.roomlinkIsDisabled = false;
    }
    
	inputLink(){
        let loginChatForm = document.getElementsByName("loginChat")[0];
        let newLinkChat = loginChatForm.roomLink.value;
        this.chat.linkchat = newLinkChat;
        
        this.chat.startChat();
	}
}

window.onload = function () {
    let loginStatus = LoginStatusEnum.CREATE_ROOM;

    let url = new URL(window.location.href);
    let key = url.searchParams.get("key");

    loginChatFormObject = new LoginChatForm();

    let loginChatForm = document.getElementsByName("loginChat")[0];
    loginChatForm.onsubmit = function () {
        switch (loginStatus) {
            case LoginStatusEnum.CREATE_ROOM: {
                loginChatFormObject.inputRoom();
                loginStatus = LoginStatusEnum.CHECK_LOGIN_ROOM;
                break;
            }
            case LoginStatusEnum.CHECK_LOGIN_ROOM: {
                loginChatFormObject.inputUsername();
                loginStatus = LoginStatusEnum.LOGIN_SUCCESS;
                break;
            }
            case LoginStatusEnum.LOGIN_SUCCESS: {
                loginChatFormObject.inputLink();
                break;
            }
        }
        return false;
    }


    // // ВАЛИДАЦИЯ
    // loginChatForm.roomName.oninput = loginChatForm.userName.oninput = function (event) {
    //     let target = event.target;

    //     if ( target.value.length < 3 || target.value.length > 50 )  {
    //         loginChatForm.nextButton.disabled = true;
    //     } else {
    //         loginChatForm.nextButton.disabled = false;
    //     }
    // }

}