extends RigidBody3D

class_name RocketBall

@export var floor_drag := 0.08
@export var air_drag := 0.03
@export var max_speed := 42.0

func _physics_process(delta):
    var vel = linear_velocity
    var drag = floor_drag if abs(global_position.y - 1.0) < 0.5 else air_drag
    linear_velocity = vel * (1.0 - drag)

    if linear_velocity.length() > max_speed:
        linear_velocity = linear_velocity.normalized() * max_speed