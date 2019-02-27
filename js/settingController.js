(function () {
    window.SettingController = class SettingController {
        static getUrl() {
            const serverAdress = "http://158.46.83.151/easychatServer/";
            // const serverAdress = "http://localhost:52834/";
            return serverAdress;
        }
        static getNumberLimitMessage() {
            const limit = 5;
            return limit; 
        }
    };
}()); 