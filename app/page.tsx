"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, Clock, Users, Trophy, Play, Square, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ScavengerItem {
  id: string
  name: string
  referenceImage: string
  points: number
  found: boolean
  photo?: string
  timestamp?: number
}

interface Team {
  name: string
  members: string[]
}

const SCAVENGER_ITEMS: ScavengerItem[] = [
  {
    id: "1",
    name: "Red Bench",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Red+Park+Bench",
    points: 10,
    found: false,
  },
  {
    id: "2",
    name: "Oak Tree",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Large+Oak+Tree+with+Acorns",
    points: 10,
    found: false,
  },
  {
    id: "3",
    name: "Water Fountain",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Working+Water+Fountain",
    points: 10,
    found: false,
  },
  {
    id: "4",
    name: "Playground Slide",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Children's+Playground+Slide",
    points: 10,
    found: false,
  },
  {
    id: "5",
    name: "Park Sign",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Main+Park+Entrance+Sign",
    points: 10,
    found: false,
  },
  {
    id: "6",
    name: "Duck Pond",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Pond+with+Ducks",
    points: 10,
    found: false,
  },
  {
    id: "7",
    name: "Picnic Table",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Wooden+Picnic+Table",
    points: 10,
    found: false,
  },
  {
    id: "8",
    name: "Trail Marker",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Numbered+Trail+Marker+Post",
    points: 10,
    found: false,
  },
  {
    id: "9",
    name: "Flower Garden",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Maintained+Flower+Garden",
    points: 10,
    found: false,
  },
  {
    id: "10",
    name: "Exercise Equipment",
    referenceImage: "/placeholder.svg?height=200&width=300&text=Outdoor+Fitness+Equipment",
    points: 10,
    found: false,
  },
]

const GAME_DURATION = 30 * 60 // 30 minutes in seconds

export default function ScavengerHuntApp() {
  const [gameState, setGameState] = useState<"setup" | "rules" | "playing" | "finished">("setup")
  const [team, setTeam] = useState<Team>({ name: "", members: [""] })
  const [items, setItems] = useState<ScavengerItem[]>(SCAVENGER_ITEMS)
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION)
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<ScavengerItem | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [rulesAccepted, setRulesAccepted] = useState<{ [key: string]: boolean }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Timer effect
  useEffect(() => {
    if (gameState === "playing" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setGameState("finished")
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameState, timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const calculateScore = () => {
    const itemPoints = items.filter((item) => item.found).length * 10
    const timeBonus = gameState === "finished" && timeRemaining > 0 ? Math.floor(timeRemaining / 10) : 0
    const latePenalty = gameState === "finished" && timeRemaining <= 0 ? -50 : 0
    return itemPoints + timeBonus + latePenalty
  }

  const startGame = () => {
    if (team.name && team.members.filter((m) => m.trim()).length >= 3) {
      setGameState("rules")
    }
  }

  const startActualGame = () => {
    setGameState("playing")
    setGameStartTime(Date.now())
  }

  const endGame = () => {
    setGameState("finished")
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const addTeamMember = () => {
    if (team.members.length < 5) {
      setTeam((prev) => ({ ...prev, members: [...prev.members, ""] }))
    }
  }

  const updateTeamMember = (index: number, value: string) => {
    setTeam((prev) => ({
      ...prev,
      members: prev.members.map((member, i) => (i === index ? value : member)),
    }))
  }

  const removeTeamMember = (index: number) => {
    if (team.members.length > 1) {
      setTeam((prev) => ({
        ...prev,
        members: prev.members.filter((_, i) => i !== index),
      }))
    }
  }

  const startCamera = async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true)
        }
      }

      setShowCamera(true)
    } catch (error) {
      console.error("Error accessing camera:", error)
      // Fallback to file upload
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.capture = "environment"

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file && selectedItem) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const photoData = event.target?.result as string
            setItems((prev) =>
              prev.map((item) =>
                item.id === selectedItem.id ? { ...item, found: true, photo: photoData, timestamp: Date.now() } : item,
              ),
            )
            setSelectedItem(null)
          }
          reader.readAsDataURL(file)
        }
      }

      input.click()
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && selectedItem && cameraReady) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert to data URL
        const photoData = canvas.toDataURL("image/jpeg", 0.8)

        // Update the item with the photo
        setItems((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id ? { ...item, found: true, photo: photoData, timestamp: Date.now() } : item,
          ),
        )

        // Clean up
        cancelCamera()
      }
    }
  }

  const cancelCamera = () => {
    setShowCamera(false)
    setSelectedItem(null)
    setCameraReady(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  if (gameState === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-green-700 flex items-center justify-center gap-2">
                <Trophy className="w-8 h-8" />
                Scavenger Hunt
              </CardTitle>
              <p className="text-gray-600">Set up your team to begin the adventure!</p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={team.name}
                  onChange={(e) => setTeam((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your team name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Team Members (3-5 required)</Label>
                <div className="space-y-2 mt-2">
                  {team.members.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={member}
                        onChange={(e) => updateTeamMember(index, e.target.value)}
                        placeholder={`Member ${index + 1} name`}
                        className="flex-1"
                      />
                      {team.members.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removeTeamMember(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {team.members.length < 5 && (
                  <Button variant="outline" onClick={addTeamMember} className="mt-2 bg-transparent">
                    Add Member
                  </Button>
                )}
              </div>

              <Button
                onClick={startGame}
                disabled={!team.name || team.members.filter((m) => m.trim()).length < 3}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Continue to Rules
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (gameState === "rules") {
    const rules = [
      {
        id: "boundaries",
        title: "Stay Within Boundaries",
        description:
          "We will stay within the designated game boundaries at all times. Going outside will result in disqualification.",
      },
      {
        id: "together",
        title: "Team Stays Together",
        description: "Our entire team will remain together at all times. No team member will separate, even briefly.",
      },
      {
        id: "phone",
        title: "One Phone Only",
        description: "We will use only one designated phone per team for the app and photo capture.",
      },
      {
        id: "photos",
        title: "Original Photos Only",
        description:
          "We will take original photos of items using the app camera. We will not photograph pictures or share photos with other teams.",
      },
      {
        id: "respect",
        title: "Respect Park Property",
        description:
          "We will not tamper with, move, or damage any scavenger hunt items or park property. We will leave no trace.",
      },
      {
        id: "safety",
        title: "Safety First",
        description:
          "We will be aware of our surroundings, avoid running or reckless behavior, and report any unsafe conditions immediately.",
      },
      {
        id: "dress",
        title: "Proper Attire",
        description: "All team members are dressed appropriately in athletic wear and proper running shoes.",
      },
      {
        id: "return",
        title: "Return on Time",
        description:
          "We will return to the starting point and end the game before the 30-minute timer expires to avoid penalties.",
      },
      {
        id: "fair",
        title: "Fair Play",
        description: "We will play fairly, follow all rules, and maintain good sportsmanship throughout the game.",
      },
    ]

    const allRulesAccepted = rules.every((rule) => rulesAccepted[rule.id])

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-green-700 flex items-center justify-center gap-2">
                <AlertTriangle className="w-8 h-8" />
                Rules & Safety Agreement
              </CardTitle>
              <p className="text-gray-600">Please read and accept each rule before starting</p>
            </CardHeader>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Team: {team.name}
              </CardTitle>
              <p className="text-sm text-gray-600">Members: {team.members.filter((m) => m.trim()).join(", ")}</p>
            </CardHeader>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-center">Game Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="font-bold text-blue-700">30 Minutes</div>
                  <div className="text-sm text-gray-600">Time Limit</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="font-bold text-green-700">10 Points</div>
                  <div className="text-sm text-gray-600">Per Item Found</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                  <div className="font-bold text-yellow-700">+1 Point</div>
                  <div className="text-sm text-gray-600">Per 10 Seconds Left</div>
                </div>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Late return (after 30 minutes) results in -50 points penalty and no time
                  bonus.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rules Agreement</CardTitle>
              <p className="text-sm text-gray-600">Each team member must agree to follow these rules:</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={rule.id}
                      checked={rulesAccepted[rule.id] || false}
                      onChange={(e) =>
                        setRulesAccepted((prev) => ({
                          ...prev,
                          [rule.id]: e.target.checked,
                        }))
                      }
                      className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <label htmlFor={rule.id} className="font-medium text-gray-900 cursor-pointer">
                        {rule.title}
                      </label>
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={() => setGameState("setup")} variant="outline" className="flex-1 bg-transparent">
              Back to Setup
            </Button>
            <Button
              onClick={startActualGame}
              disabled={!allRulesAccepted}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Scavenger Hunt
            </Button>
          </div>

          {!allRulesAccepted && (
            <p className="text-center text-sm text-red-600 mt-2">Please accept all rules to continue</p>
          )}
        </div>
      </div>
    )
  }

  if (gameState === "playing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with Timer and Score */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-2xl font-bold text-green-700">
                      <Clock className="w-6 h-6" />
                      {formatTime(timeRemaining)}
                    </div>
                    <p className="text-sm text-gray-600">Time Remaining</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{calculateScore()}</div>
                    <p className="text-sm text-gray-600">Current Score</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="font-bold text-lg">{team.name}</h2>
                  <p className="text-sm text-gray-600">
                    {items.filter((item) => item.found).length}/{items.length} items found
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {items.map((item) => (
              <Card key={item.id} className={`${item.found ? "bg-green-50 border-green-200" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        {item.found ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                        {item.name}
                      </h3>
                    </div>
                    <Badge variant={item.found ? "default" : "secondary"}>{item.points} pts</Badge>
                  </div>

                  {/* Reference Image */}
                  <div className="mb-3">
                    <img
                      src={item.referenceImage || "/placeholder.svg"}
                      alt={`Reference: ${item.name}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">Find and photograph this item</p>
                  </div>

                  {item.found ? (
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        ✓ Captured
                      </Badge>
                      {item.photo && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-2 bg-transparent">
                              View Photo
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{item.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium mb-2">Reference:</p>
                                <img
                                  src={item.referenceImage || "/placeholder.svg"}
                                  alt={`Reference: ${item.name}`}
                                  className="w-full rounded-lg border"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">Your Photo:</p>
                                <img
                                  src={item.photo || "/placeholder.svg"}
                                  alt={item.name}
                                  className="w-full rounded-lg border"
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedItem(item)
                        startCamera()
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* End Game Button */}
          <Card>
            <CardContent className="p-4 text-center">
              <Button onClick={endGame} size="lg" className="bg-red-600 hover:bg-red-700">
                <Square className="w-5 h-5 mr-2" />
                End Game & Submit
              </Button>
              <p className="text-sm text-gray-600 mt-2">Return to start point and click this button to finish</p>
            </CardContent>
          </Card>
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Capture: {selectedItem?.name}</h3>
                <Button onClick={cancelCamera} variant="ghost" size="sm">
                  ✕
                </Button>
              </div>

              {/* Reference image */}
              {selectedItem && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Find this item:</p>
                  <img
                    src={selectedItem.referenceImage || "/placeholder.svg"}
                    alt={`Reference: ${selectedItem.name}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                </div>
              )}

              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg bg-black"
                  style={{ aspectRatio: "4/3" }}
                />
                <canvas ref={canvasRef} className="hidden" />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-600 mb-3">Camera not available</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file && selectedItem) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const photoData = event.target?.result as string
                              setItems((prev) =>
                                prev.map((item) =>
                                  item.id === selectedItem.id
                                    ? { ...item, found: true, photo: photoData, timestamp: Date.now() }
                                    : item,
                                ),
                              )
                              cancelCamera()
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                      />
                      <Button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700">
                        Choose Photo from Gallery
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={capturePhoto} disabled={!cameraReady} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
                <Button onClick={cancelCamera} variant="outline" className="flex-1 bg-transparent">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Finished state
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-green-700 flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8" />
              Game Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl font-bold text-blue-700">{calculateScore()}</div>
            <p className="text-xl text-gray-600">Final Score</p>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{items.filter((item) => item.found).length}</div>
                <p className="text-sm text-green-600">Items Found</p>
                <p className="text-xs text-gray-500">{items.filter((item) => item.found).length * 10} points</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{formatTime(Math.max(0, timeRemaining))}</div>
                <p className="text-sm text-blue-600">Time Bonus</p>
                <p className="text-xs text-gray-500">
                  {timeRemaining > 0 ? `+${Math.floor(timeRemaining / 10)}` : timeRemaining === 0 ? "-50" : "0"} points
                </p>
              </div>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Submission Complete!</strong>
                <br />
                Your photos and score have been recorded. Please wait for coach verification of your items.
              </AlertDescription>
            </Alert>

            <div className="text-left">
              <h3 className="font-semibold mb-2">Items Captured:</h3>
              <div className="space-y-1">
                {items
                  .filter((item) => item.found)
                  .map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {item.name}
                    </div>
                  ))}
              </div>
            </div>

            <Button
              onClick={() => {
                setGameState("setup")
                setItems(SCAVENGER_ITEMS)
                setTimeRemaining(GAME_DURATION)
                setTeam({ name: "", members: [""] })
                setRulesAccepted({})
              }}
              className="w-full"
              variant="outline"
            >
              Start New Game
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
