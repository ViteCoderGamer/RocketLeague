extends Node3D

@onready var camera: Camera3D = $Camera3D
@export var target_path: NodePath
@export var follow_speed := 0.12
@export var height_offset := 7.0
@export var distance_back := 16.0
@export var look_ahead := 4.0

var target: Node3D

func _ready():
    target = get_node(target_path)

func _physics_process(delta):
    if not target:
        return

    var desired_pos = target.global_position + Vector3(0, height_offset, distance_back)
    var desired_look = target.global_position + Vector3(0, 1.5, -look_ahead)

    global_position = global_position.lerp(desired_pos, follow_speed)
    look_at(desired_look, Vector3.UP)