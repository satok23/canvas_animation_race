import React, { useEffect, useRef, FC, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import bg_ground from './assets/bg_ground.png'
import confetti from 'canvas-confetti'
// import parrots_src from './assets/parrot_pngs/*.png'
import './App.css'
import { Link } from "react-router-dom"
import { LinkButton } from './components/link';
import  useConfetti  from "./useSmallConfetti";


class Sprite{
  x: number;
  y: number;
  name:string;
  view_name:string;
  isFinished:boolean;
  isFinish_registered:boolean;
  remainCount: number;
  addValue: number;
  frames: HTMLImageElement[];
  frameIndex = 0;
  lastTime = 0;
  judgeman: JudgeMan;
  readonly goalCount = 500;
  readonly frameDuration: number = 100;
  readonly random_max_lim = 20;
  readonly random_min_lim = 0;

  constructor(name: string, x: number, y: number, judgeman:JudgeMan, frames:HTMLIMageElement[] ) {
    this.name = name;
    this.view_name = this.name;
    this.x = x;
    this.y = y;
    this.isFinished = false;
    this.isFinish_registered = false;
    this.judgeman = judgeman;
    this.judgeman.add(this.name, this);
    this.frames = frames;
    this.remainCount = this.goalCount;
    this.addValue = 0;
    // console.log("this called in Sprite constructor");

  }

  randomInt = (min: number, max: number) => {
    return (Math.floor(Math.random() * (max - min +1)) + min);
  }
  
  increment = () => {
    this.x += this.addValue;
    // setNum(refNum.current);
  };

  move_forward = () => {
    const random_max = Math.min(this.remainCount, this.random_max_lim);
    const randomValue = this.randomInt(this.random_min_lim, random_max);
    // ゴール判定
    this.isFinished = this.remainCount <= 0;
    // ゴールに着いたら止まる
    //  if ((this.remainCount- randomValue) < 0) {
    if (this.isFinished) {
      //すでについている場合はスキップ
      if (this.isFinish_registered){
        return;
      }
      
      // console.log("runner finish")
      // judgemanに申告
      this.judgeman.register_arrive(this.name);
      // setMoveCount(0);
      this.remainCount = 0;
      this.addValue = 0;
      this.isFinished_registered = true;
      this.increment();
    }
    else{
      // setMoveCount(moveCount - randomValue);
      this.remainCount = this.remainCount - randomValue;
      this.addValue = randomValue;
      this.increment();
    }
  };

  draw = (ctx: CanvasRenderingContext2D) => {
    // キャンバス描画
    const img = this.frames[this.frameIndex];
    ctx.drawImage(img, this.x, this.y);
  }
  
  update(past_time: number) {
    if (past_time - this.lastTime > this.frameDuration) {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.move_forward();
      this.lastTime = past_time;

    }
    
  }

  resetPosition = () => {
    // const {handleNormalConfetti} = useConfetti(0.5, 0.5);
    // handleNormalConfetti();
    
    this.x = 0;
    this.remainCount = this.goalCount;

    // console.log(this.judgeman.get_first());
  }
}

// ジャッジマンがすること
// DONE レースの順位を保持
// DONE ゴールした人が登録する
// DONE ゴールすると紙吹雪を舞わせる
// TODO 紙吹雪の場所と角度を調整

class JudgeMan {
  runners: Record<string, Sprite> = {};
  arrived_order: Record<string, Sprite> = {};
  test_num:number = 1;
  isFinish:boolean = false;


  add(key: string, value: Sprite) {
    this.runners[key] = value;

    console.log("test")
  }

  // runnersから値をもってくると参照がどうなるか気になる。
  register_arrive(input_name:string){
    // 登録者じゃない場合リターン
    if(!Object.keys(this.runners).includes(input_name)){
      return;
    }
    const arrived_runner:Sprite = this.runners[input_name];
    // 既に到着者に登録済みの場合リターン
    if(Object.values(this.arrived_order).includes(arrived_runner)){
      return;
    }
    // console.log("call judgeman!")

    
    const current_latest_order:number = Object.keys(this.arrived_order).length + 1;

    const order_key:string = current_latest_order.toString() + "th";
    console.log("order :"+order_key + " is " + input_name);
    // let order_key:strig = "first"

    this.arrived_order[order_key] = this.runners[input_name];
    
    // 紙吹雪
    const {handleNormalConfetti} = useConfetti(0.5, 0.5);
    handleNormalConfetti();

    // 全員到着したらfinish
    if( Object.values(this.arrived_order).length === Object.values(this.runners).length ){
      this.isFinish = true;
    }


  }

  get_first() {
    if (Object.keys(this.arrived_order).length == 0){
      return "wait still not finish!";
    }

    let first_key:string = "1th";
    const first_goal:Sprite = this.arrived_order[first_key];

    // console.log(first_goal.name);
    return first_goal.name;
  }

  get(key: string): v | undefined {
    return this.runners[key];
  }

  reset = () => {
    this.arrived_order = {};
  };

  

};

type Scene = "title" | "game" | "result";

// game manager
// TODO スタートさせる
// TODO シーンを変更する
// TODO 全員終了したのを確認
// TODO 終了後に画面遷移
// TODO フェードアウトアニメーション
// TODO コールバックを渡すように変更が必要
class GameManager{

  current_scene:Scene = "title" ;

  start_game() {
    // sceneをgameに変更する
    this.current_scene = "game";
  }

};


class GameScene {
  judgeman: JudgeMan;
  bg_image:HTMLImageElement;
  runner_list:Sprite[] = [];

  canvas_width:number;
  canvas_height:number;

  constructor(canvas_width:number, canvas_height:number, frames:HTMLImageElement[], bg_image:HTMLImageElement) {
    this.canvas_width = canvas_width;
    this.canvas_height = canvas_height;
    
    this.judgeman = new JudgeMan();
    this.bg_image = new Image();
    this.bg_image = bg_image;
    
    const name_list:string[] = ["parrot1", "parrot2", "parrot3", "parrot4"];
    name_list.forEach((name, index) => {
      const y_coord: number = (index+1)*100
      const new_runner:Sprite = new Sprite(name, 0, y_coord, this.judgeman, frames);
      this.runner_list.push(new_runner);

    }); 

  }

  start_game(){
    
    this.reset_position();
  }

  reset_position() {
    this.runner_list.forEach( value => {
        value.resetPosition();
    });
    this.judgeman.reset();
  }

  update(input_time:number){
    this.runner_list.forEach( runner => {
      runner.update(input_time);
    });

  };

  draw(ctx:CanvasRenderingContext2D){
    // background 描画
    ctx.clearRect(0, 0, this.canvas_width, this.canvas_height);
    ctx.drawImage(this.bg_image, 0, 100);

    // runnerの描画
    this.runner_list.forEach( runner => {
      runner.draw(ctx);
    })
  };

  // 終了の確認
  isFinished():boolean {
    return this.judgeman.isFinish;
  };
  
}

class ResultRunner {
  name: string;
  view_name: string;
  order: string;
  description: string;
  
  constructor(name:string, view_name:string, order:string, description: string) {
      this.name=name;
      this.view_name=view_name;
      this.order=order;
      this.description =description;
  }
}



export const App = () => {
  
  // UI&シーン切り替えよう型
  type TitleProps = {
    onStart: () => void;
  }

  // タイトル画面
  const TitleUI: React.FC<TitleProps> = ({ onStart }) => {
    return (
      <div>
        <h1>タイトル</h1>
        <button className="fancy-btn" onClick= {onStart}> スタート </button>
      </div>
    )
  };

  const [gameFinished, setGameFinish] = useState(false);
  const gameFinishedRef = useRef(false);

  type GameProps = {
    onReset: () => void;
    onResult: () => void;
    gameFinished: boolean;
  }
  // ゲーム画面
  const GameUI: React.FC<GameProps> = ({ onReset, onResult, gameFinished }) => {
    return (
      <div>
        <button onClick = {onReset}>リセット</button>
        <button onClick = {onResult} disabled={!gameFinished}>結果を見る</button>
      </div>
    )
  }


  //TODO 描画用の処理
  const ResultUI: React.FC<ResultProps> = ({ runners_list }) => {
    const [selectedResult, setSelectedResult] = useState<ResultProps | null> (null);
    // const [RunnersListState, setRunnerListState] = useState(runners_list);
    return (
      <div className="resultContainer">
        <div className="resultSidebar">
         
          {runners_list.map((item) => (
            <div
            key={item.order}
            onClick={() => setSelectedResult(item)}
            className={`resultItem ${selectedResult?.order === item.order ? "resultActive" : ""}`}
            >
              {item.order + " " + item.view_name}
            </div>
          ))}
        </div>

        <div className="resultContent">
          {selectedResult ? (
            <>
              <h2>{selectedResult.view_name} </h2>
              <p>{selectedResult.description}</p>
            </>
          ): (
            <p>項目を選択してください</p>
          )
        }
        </div>
      </div>
    );

  }

  const [current_scene, setScene] = useState<Scene>("title");
  const sceneRef = useRef<Scene>(current_scene);
  // current_scene監視用
  useEffect( () => {
    sceneRef.current = current_scene;
  }, [current_scene]);

  // game finished監視用
  useEffect( () => {
    gameFinishedRef.current = gameFinished;
  }, [gameFinished]);



  const handleStartGame = () => {
    setScene("game");
    console.log("current_scene is" + current_scene );
  }


  const canvasRef = useRef<HTMLCanvasElement>(null);


  const [debug_string, setDebug_string] = useState("");
  const [debug_remain, setDebug_remain] = useState(100);

  const myGameScene = useRef<GameScene | null>(null);



  // 初期化
  useEffect(() => {
    // parrot画像の取得
    const parrot_images = import.meta.glob('./assets/parrot_pngs/*.png', {
        eager: true,
        import: "default"
    });

    const input_imgs: HTMLImageElement[] = [];
    const framePaths = Object.values(parrot_images);

    framePaths.forEach((path) => {
      const img = new Image();
      img.src = path as string;
      input_imgs.push(img);
    });

    // 背景画像取得
    const bg_img = new Image();
    bg_img.src = bg_ground;

    // gamesceneの作成
    if (!canvasRef.current) return;
    myGameScene.current = new GameScene(canvasRef.current.width, canvasRef.current.height, input_imgs, bg_img);
    


  }, []);

    // 初期位置に移動するイベント
  const resetPosition = () => {
    // spriteRef.current.resetPosition();
    // parrot2.current.resetPosition();
    myGameScene.current.reset_position();
  };

  const frameIndexRef = useRef(0);


  const sleep = (ms:2000) => {
    new Promise(resolve => setTimeout(resolve, ms));
  }

  type ResultProps = {
    runners_list:ResultRunner[];
  }
  const [result_for_view_list,setResultForViewList] = useState<ResultRunner[]>([]);
  // resultに遷移する

  const handleResult = () => {
    setScene("result");

    // 着順をもとにResultRunnerを作成
    // TODO: gameobjectのバリデーション
    const order_label:string[] = ["1th", "2th", "3th", "4th"];
    const order_descript:string[] = [
      "1位のテキスト",
      "2位のテキスト",
      "3位のテキスト",
      "4位のテキスト"
    ];
    
    // result runnerを作成
    order_label.forEach((order, index) => {
      if (!myGameScene.current) return;
    
      const one_runner:Sprite = myGameScene.current?.judgeman.arrived_order[order]
      const runner_for_view:ResultRunner = new  ResultRunner(
        one_runner.name,
        one_runner.view_name,
        order,
        order_descript[index]
         );
      // result_for_view_list.push(runner_for_view);
      setResultForViewList(prev => [...prev, runner_for_view]);
      console.log("set " + one_runner.name + " to " + order);
    }); 


    console.log("current_scene is " + current_scene);
  }
  

  // 画像のレンダリング
  useEffect(() => {

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    


    const render = async (time: number) => {
      

      if (sceneRef.current === "game"){
        // console.log("current_scene is game");
        myGameScene.current.update(time);
        myGameScene.current.draw(ctx);
        const finished = myGameScene.current.isFinished();
        
        setGameFinish(finished)
        
        
        
      }

      if (sceneRef.current === "result"){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
      }
      


      // 10fに一度state更新
      // if ( judgeman.current && Math.floor(time) % 2 === 0){
      //   setDebug_string(judgeman.current.get_first())

      // }
      // setDebug_remain(parrot2.current?.remainCount)
      
      requestAnimationFrame(render);

    };


    render();

  }, []);

  return (
    <>
    <div className="container">
      <canvas ref={ canvasRef } width = {1000} height = {600}></canvas>
      <div className="ui-layer">
      {current_scene == "title" && <TitleUI onStart={ handleStartGame } />}
      {current_scene == "game" && <GameUI onReset={ resetPosition} onResult={ handleResult } gameFinished={ gameFinished }/>}
      {current_scene == "result" && <ResultUI runners_list={ result_for_view_list } />}

    </div>
      
    
    </div>



    {/* <button onClick={ resetPosition }>リセット</button> */}
    
    <label>{ debug_string } </label> 
    
    
    
    </>
    

  );
};

export default App
