extends RigidBody3D

class_name RocketCar

@export var acceleration := 1900.0
@export var reverse_acceleration := 1300.0
@export var max_speed := 24.0
@export var turn_strength := 2.1
@export var air_turn_strength := 0.8
@export var boost_force := 2200.0
@export var max_boost := 100.0
@export var boost_regen := 18.0
@export var jump_force := 9.5
@export var gravity := 28.0
@export var flip_strength := 1.8

var input_dir := Vector2.ZERO
var boost_amount := 100.0
var grounded := true
var is_bot := false
var team := "blue"
var target_ball: Vector3 = Vector3.ZERO

@onready var ground_check: RayCast3D = $GroundCheck
@onready var wheel_visuals: Node3D = $WheelVisuals

func _ready():
    contact_monitor = true
    max_contacts_reported = 10
    physics_material_override = PhysicsMaterial.new()
    physics_material_override.bounce = 0.08
    physics_material_override.friction = 0.6

func _physics_process(delta):
    if is_bot:
        _update_bot_ai(delta)
    else:
        _update_player(delta)

    _update_grounding()
    _cap_speed()
    _apply_drag(delta)
    _update_boost(delta)

func _update_player(delta):
    var forward = Input.get_action_strength("move_forward")
    var back = Input.get_action_strength("move_back")
    var steer_left = Input.get_action_strength("turn_left")
    var steer_right = Input.get_action_strength("turn_right")
    var throttle = forward - back
    var steer = steer_right - steer_left

    input_dir = Vector2(steer, throttle)

    var forward_vec = -transform.basis.z
    var right_vec = transform.basis.x

    if grounded:
        var force = Vector3.ZERO
        force += forward_vec * throttle * acceleration
        force += right_vec * steer * 500.0

        apply_central_force(force * delta * 60.0)

        var turn_torque = Vector3.UP * steer * turn_strength * 500.0
        apply_torque(turn_torque * delta * 60.0)

        if Input.is_action_just_pressed("jump"):
            apply_central_impulse(Vector3.UP * jump_force * 110.0)
            grounded = false

    else:
        var air_torque = Vector3.UP * steer * air_turn_strength * 520.0
        apply_torque(air_torque * delta * 60.0)

        if Input.is_action_pressed("turn_left"):
            apply_torque(Vector3.BACK * flip_strength * 180.0 * delta)
        if Input.is_action_pressed("turn_right"):
            apply_torque(Vector3.FORWARD * flip_strength * 180.0 * delta)

    if Input.is_action_pressed("boost") and boost_amount > 0:
        apply_central_force(forward_vec * boost_force * delta * 60.0)
        boost_amount = max(0.0, boost_amount - 36.0 * delta)

func _update_bot_ai(delta):
    var arena = get_parent()
    if arena and arena.has_method("get_ball_position"):
        target_ball = arena.get_ball_position()

    var to_ball = target_ball - global_position
    var horizontal = Vector2(to_ball.x, to_ball.z)

    if horizontal.length() < 0.001:
        return

    var target_dir = horizontal.normalized()
    var forward_dir = Vector2(-transform.basis.z.x, -transform.basis.z.z).normalized()
    var angle_to_target = forward_dir.angle_to(target_dir)

    var steer = clamp(angle_to_target * 2.2, -1.0, 1.0)
    var throttle = 1.0 if horizontal.length() > 8.0 else 0.35

    if grounded:
        var forward_vec = -transform.basis.z
        var right_vec = transform.basis.x
        var force = Vector3.ZERO
        force += forward_vec * throttle * acceleration
        force += right_vec * steer * 500.0
        apply_central_force(force * delta * 60.0)

        var turn_torque = Vector3.UP * steer * turn_strength * 520.0
        apply_torque(turn_torque * delta * 60.0)

        if horizontal.length() < 7.0 and grounded:
            apply_central_impulse(Vector3.UP * jump_force * 100.0)
            grounded = false

    else:
        apply_torque(Vector3.UP * steer * air_turn_strength * 500.0 * delta * 60.0)

    if horizontal.length() > 18.0 and boost_amount > 12.0:
        var fwd = -transform.basis.z
        apply_central_force(fwd * boost_force * delta * 60.0)
        boost_amount -= 25.0 * delta

func _update_grounding():
    grounded = ground_check.is_colliding()

func _apply_drag(delta):
    if grounded:
        var forward = -transform.basis.z
        var forward_speed = linear_velocity.dot(forward)
        var lateral = linear_velocity - forward * forward_speed
        linear_velocity -= lateral * 0.9 * delta * 60.0

func _cap_speed():
    var speed = linear_velocity.length()
    if speed > max_speed:
        linear_velocity = linear_velocity.normalized() * max_speed

func _update_boost(delta):
    if boost_amount < max_boost:
        boost_amount = min(max_boost, boost_amount + boost_regen * delta)

func add_boost(amount: float):
    boost_amount = clamp(boost_amount + amount, 0.0, max_boost)