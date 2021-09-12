import kaboom from "kaboom";

kaboom();

scene("game", () => {
  let arena = [];

  const TILE_SIZE = 80;
  const OFFSET = 100;

  // i is the column, j is the row (unfortunately)
  for (let i = 0; i < 6; i++) {
    let col = [];
    for (let j = 0; j < 3; j++) {
      const box = add([
        rect(TILE_SIZE, TILE_SIZE),
        outline(4),
        pos(TILE_SIZE * i + OFFSET, TILE_SIZE * j + OFFSET),
        // light sky blue
        i < 3 ? color(255, 127, 127) : color(135, 206, 250),
        area(),
        { isPlayerTile: i < 3 },
      ]);
      col.push(box);
    }
    arena.push(col);
  }

  // player information
  const player = add([
    rect(TILE_SIZE * 0.8, TILE_SIZE * 0.8),
    color(0, 0, 255),
    pos(arena[1][1].pos.add(TILE_SIZE * 0.1, TILE_SIZE * 0.1)),
    area(),
    health(140),
    "player",
    { x: 1, y: 1 },
  ]);

  const playerHP = add([text(player.hp()), outline(4), pos(100, 0)]);
  player.on("hurt", () => {
    playerHP.text = player.hp();
  });

  function spawnEnemy(x, y) {
    // add a random monster
    const enemy = add([
      rect(TILE_SIZE * 0.8, TILE_SIZE * 0.8),
      color(255, 0, 0),
      pos(arena[x][y].pos.add(TILE_SIZE * 0.1, TILE_SIZE * 0.1)),
      area(),
      health(40),
      "enemy",
      { x: x, y: y, aggroTimer: 0, isAttacking: false },
    ]);

    // also add hp on top of the monster
    let status = add([
      text(enemy.hp(), { size: TILE_SIZE * 0.75 }),
      pos(enemy.pos),
    ]);
    enemy.on("hurt", () => {
      status.text = enemy.hp();
    });
    enemy.on("death", () => {
      addKaboom(enemy.pos);
      enemy.destroy();
      status.destroy();
    });

    enemy.action(() => {
      // check for aggro
      if (player.y == enemy.y) {
        // maybe we run too many frames?
        enemy.aggroTimer += dt();
        if (enemy.aggroTimer >= 2 && !enemy.isAttacking) {
          enemy.isAttacking = true;
          let wave = add([
            rect(20, 20),
            color(255, 255, 255),
            pos(enemy.pos.add(20, 20)),
            area(),
            move(LEFT, 300),
            "enemyWave",
          ]);
          wave.collides("player", (player) => {
            player.hurt(5);
            wave.destroy();
            enemy.isAttacking = false;
          });
          wave.action(() => {
            if (wave.pos.x < 0) {
              wave.destroy();
              enemy.isAttacking = false;
            }
          });
          enemy.aggroTimer = 0;
        }
      }
    });
  }

  spawnEnemy(4, 0);
  spawnEnemy(4, 2);
  spawnEnemy(5, 1);

  function doMove(player, offX, offY) {
    let x = player.x + offX;
    let y = player.y + offY;
    if (!(x >= 0 && x < 6) || !(y >= 0 && y < 3) || !arena[x][y].isPlayerTile) {
      return;
    }
    player.moveTo(arena[x][y].pos.add(10, 10));
    player.x = x;
    player.y = y;
  }

  keyPress("left", () => doMove(player, -1, 0));
  keyPress("right", () => doMove(player, 1, 0));
  keyPress("up", () => doMove(player, 0, -1));
  keyPress("down", () => doMove(player, 0, 1));
  keyPress("x", () => {
    // fire some sort of projectile...
    let bullet = add([
      rect(20, 20),
      color(255, 255, 255),
      pos(player.pos.add(20, 20)),
      area(),
      move(RIGHT, 800),
      "bullet",
    ]);
    bullet.collides("enemy", (enemy) => {
      // TODO: make a new component
      enemy.hurt(1);
      bullet.destroy();
    });
  });
});

go("game");
