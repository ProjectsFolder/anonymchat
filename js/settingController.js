(function () {
    window.SettingController = class SettingController {
        static getUrl() {
            // const serverAdress = "http://158.46.83.151/easychatServer/";
            const serverAdress = "http://127.0.0.1:8000/"
            // const serverAdress = "http://158.46.83.151:88/ChatAppBackend2/public/"
            return serverAdress;
        }
    };
}()); 