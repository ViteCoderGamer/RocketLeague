extends Area3D

@export var boost_amount := 35.0
@export var pad_radius := 2.5

func _ready():
    body_entered.connect(_on_body_entered)

func _on_body_entered(body):
    if body is RocketCar:
        body.add_boost(boost_amount)