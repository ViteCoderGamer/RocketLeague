extends Node3D

@onready var player_car: RigidBody3D = $PlayerCar
@onready var bot_1: RigidBody3D = $BotCar1
@onready var bot_2: RigidBody3D = $BotCar2
@onready var ball: RigidBody3D = $Ball
@onready var blue_goal_area: Area3D = $BlueGoalArea
@onready var orange_goal_area: Area3D = $OrangeGoalArea
@onready var timer_label: Label = $CanvasLayer/TimerLabel
@onready var blue_score_label: Label = $CanvasLayer/BlueScore
@onready var orange_score_label: Label = $CanvasLayer/OrangeScore

var blue_score := 0
var orange_score := 0
var match_time := 90.0
var kickoff_timer := 2.0
var playing := false

func _ready():
    _register_input_actions()
    _reset_positions()
    _start_kickoff()

func _process(delta):
    if playing:
        match_time -= delta
        timer_label.text = "%02d:%02d" % [int(match_time / 60), int(match_time) % 60]

    if match_time <= 0:
        match_time = 90.0
        _reset_positions()
        _start_kickoff()

    if kickoff_timer > 0:
        kickoff_timer -= delta
        if kickoff_timer <= 0:
            playing = true

func _register_input_actions():
    if not InputMap.has_action("move_forward"):
        InputMap.add_action("move_forward")
        InputMap.add_action("move_back")
        InputMap.add_action("turn_left")
        InputMap.add_action("turn_right")
        InputMap.add_action("jump")
        InputMap.add_action("boost")

    _bind_key("move_forward", KEY_W)
    _bind_key("move_back", KEY_S)
    _bind_key("turn_left", KEY_A)
    _bind_key("turn_right", KEY_D)
    _bind_key("jump", KEY_SPACE)
    _bind_key("boost", KEY_SHIFT)

func _bind_key(action_name: StringName, key_code: Key):
    var event = InputEventKey.new()
    event.physical_keycode = key_code
    InputMap.action_add_event(action_name, event)

func _reset_positions():
    player_car.global_position = Vector3(0, 2.0, 12.0)
    player_car.linear_velocity = Vector3.ZERO
    player_car.angular_velocity = Vector3.ZERO

    bot_1.global_position = Vector3(12.0, 2.0, -10.0)
    bot_1.linear_velocity = Vector3.ZERO
    bot_1.angular_velocity = Vector3.ZERO

    bot_2.global_position = Vector3(-12.0, 2.0, -10.0)
    bot_2.linear_velocity = Vector3.ZERO
    bot_2.angular_velocity = Vector3.ZERO

    ball.global_position = Vector3.ZERO
    ball.linear_velocity = Vector3.ZERO

func _start_kickoff():
    kickoff_timer = 2.0
    playing = false
    _reset_positions()

func _on_goal_scored(side: String):
    if side == "blue":
        blue_score += 1
    else:
        orange_score += 1

    blue_score_label.text = str(blue_score)
    orange_score_label.text = str(orange_score)

    _reset_positions()
    _start_kickoff()

func get_ball_position() -> Vector3:
    return ball.global_position