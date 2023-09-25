// ==================== Title ====================

  /* ---------------------------------------- *\
   *  Name        :  genshin                  *
   *  Description :  原神启动                  *
   *  Version     :  1.0.6                    *
   *  Author      :  ENIAC_Jushi              *
  \* ---------------------------------------- */


const TITLE_TIME = 13.6;
const TOTAL_TIME = 22;
// ================== Initialize ===================
let version = 1.0
logger.setConsole(true);
logger.setTitle('Genshin');
logger.info('Genshin is running');

// cmd
var CommandManager = {
    set:function(){
        this.start();
    },
    start(){
        var cmd = mc.newCommand("startgenshin", "启动原神", PermType.Any);

        cmd.mandatory("players", ParamType.Player);
        
        cmd.overload (["players"]);
        cmd.overload();
        
        cmd.setCallback((_cmd, _ori, out, res) => {
            // log(_ori.type)
            if(res.players){
                /** _ori.type
                 * 0: 玩家主动执行
                 * 1: 命令方块
                 * 7: 控制台
                 * 9: 实体(excute)
                 * 13: NPC命令
                 */
                if((_ori.type == 1) ||
                   (_ori.type == 7) ||
                   (_ori.type == 13) ||
                   (_ori.player && _ori.player.permLevel >= 1)){
                    let amount = 0;
                    for(let player of res.players){
                        if(startGenshin(player)){
                            amount++;
                        }
                    }
                    return out.success(`已为 ${amount} 名玩家启动原神。`);
                }
                else{
                    return out.error("您不是管理员^ ^");
                }
            }
            else{
                if(_ori.player){
                    startGenshin(_ori.player);
                    return out.success();
                }
                else{
                    return out.error("只能由玩家执行此条指令。");
                }
            }
        });
        cmd.setup();
    }
}
CommandManager.set();

// step: 0 前奏(0~TITLE_TIME) 1 标题显示(TITLE_TIME~TOTAL_TIME)
var profile = {};
function startGenshin(pl){
    // 若已经在启动，则退出
    if(profile[pl.realName] != null){
        return false;
    }

    // 创建档案
    profile[pl.realName] = {
        "step": 0,
        "start_time": new Date().getTime()
    }
    // 播放声音 因为本人播放有信息，这里由服务器播放
    mc.runcmd("playsound \"genshin_full\" " + getPlayerCommandString(pl.realName));
    
    // 通知
    pl.tell("\n  §d正 §3在 §6为 §l§e您 §r§5启 §9动 §a原 §b神 §c. §2. §4.  \n  ");

    // 启动检测循环
    startScanLoop();
    
    return true;
}

var intervalId = -1;
function startScanLoop(){
    if(intervalId != -1) return false;
    intervalId = setInterval(() => {
        let now_time = new Date().getTime();
        let playerList = mc.getOnlinePlayers();
        let runnning = false;
        for (var pl of playerList) {
            let player_profile = profile[pl.realName];
            if(player_profile != null){
                runnning = true;
                let pased_time = now_time - player_profile["start_time"];
                // 完成任务，移出
                if(pased_time > 1000*TOTAL_TIME){
                    delete profile[pl.realName];
                }
                // 已完成第一步
                else if(pased_time > 1000*TITLE_TIME){
                    if(player_profile["step"] == 0){
                        player_profile["step"] = 1;
                        // 展示启动界面 完整覆盖音频，淡出半秒
                        let nameString = getPlayerCommandString(pl.realName);
                        mc.runcmd(`title ${nameString} times 0 ${(TOTAL_TIME - TITLE_TIME) * 20 - 10} 10`)
                        mc.runcmd(`title ${nameString} title genshin`)
                        // 符卡宣言
                        pl.talkAs("§2原 §a神§6 , §g启 §e动 §6!");
                    }
                }
            }
        }
        if(!runnning){
            stopScanLoop();
        }
    }, 40);
    return true;
}
function stopScanLoop(){
    if(intervalId!=-1){
        clearInterval(intervalId);
    }
    intervalId = -1
}
function getPlayerCommandString(realName){
    let nameString = realName;
    if (nameString.indexOf(' ') != -1) {
        nameString = `"${nameString}"`
    }
    return nameString;
}

mc.listen("onLeft", (pl) => {
    delete profile[pl.realName];
});