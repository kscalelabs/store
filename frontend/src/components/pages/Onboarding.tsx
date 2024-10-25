"use client";

import { useEffect, useRef, useState } from "react";
import { FaDownload, FaFileDownload, FaHome, FaList } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

import FileRenderer from "@/components/files/FileRenderer";
import { parseTar } from "@/components/files/Tarfile";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { components } from "@/gen/api";
import { humanReadableError, useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import pako from "pako";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { ServoControlClient } from "@/lib/openlch-server-grpc/hal_pb.client";
import * as hal_pb from "@/lib/openlch-server-grpc/hal_pb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import stompy from "@/images/stompy.png";

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface UntarredFile {
  name: string;
  content: Uint8Array;
}

enum JointEnum {
  RIGHT_SHOULDER_PITCH = "right_shoulder_pitch",
  LEFT_SHOULDER_PITCH = "left_shoulder_pitch",
  RIGHT_HIP_PITCH = "right_hip_pitch",
  LEFT_HIP_PITCH = "left_hip_pitch",
  RIGHT_HIP_YAW = "right_hip_yaw",
  LEFT_HIP_YAW = "left_hip_yaw",
  RIGHT_HIP_ROLL = "right_hip_roll",
  LEFT_HIP_ROLL = "left_hip_roll",
  // Add other joints as needed
}

// Mock GRPC functions
const getServos = async (): Promise<number[]> => {
  // Simulate getting servo IDs from the robot
  return [1, 2, 3, 4, 5, 6]; // Example servo IDs
};

const wiggleServo = async (id: number): Promise<void> => {
  // Simulate wiggling a servo
  console.log(`Wiggling servo ${id}`);
};

const changeServoId = async (oldId: number, newId: number): Promise<void> => {
  // Simulate changing a servo ID
  console.log(`Changing servo ID from ${oldId} to ${newId}`);
};

const startCalibration = async (): Promise<void> => {
  // Simulate starting calibration
  console.log("Calibration started");
};

const getCalibrationStatus = async (): Promise<"in_progress" | "completed"> => {
  // Simulate getting calibration status
  return "completed";
};

const cancelCalibration = async (): Promise<void> => {
  // Simulate canceling calibration
  console.log("Calibration canceled");
};

const RobotRenderer = () => {
  const artifactId = "28a426fd25d70716";
  const [artifact, setArtifact] = useState<SingleArtifactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [untarring, setUntarring] = useState(false);
  const [untarredFiles, setUntarredFiles] = useState<UntarredFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UntarredFile | null>(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!artifactId || artifact) return;

      try {
        const { data, error } = await auth.client.GET(
          "/artifacts/info/{artifact_id}",
          {
            params: { path: { artifact_id: artifactId } },
          },
        );

        if (error) {
          addErrorAlert(error);
        } else {
          setArtifact(data);
        }
      } catch (err) {
        addErrorAlert(humanReadableError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [
    artifactId,
    auth.client,
    addErrorAlert,
    artifact,
    setArtifact,
    setLoading,
  ]);

  const handleLoadAndUntar = async () => {
    if (!artifact?.urls?.large) {
      addErrorAlert("Artifact URL not available.");
      return;
    }

    setUntarring(true);
    try {
      const response = await fetch(artifact.urls.large);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Decompress gzip
      const decompressed = pako.ungzip(uint8Array);

      // Parse tar
      const files = parseTar(decompressed);

      setUntarredFiles(files);
    } catch (err) {
      addErrorAlert(`Error loading file: ${humanReadableError(err)}`);
    } finally {
      setUntarring(false);
    }
  };

  const handleDownload = () => {
    if (!artifact?.urls.large) {
      addErrorAlert("Artifact URL not available.");
      return;
    }

    const link = document.createElement("a");
    link.href = artifact.urls.large;
    link.download = `${artifact.name}.tgz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    (async () => {
      if (artifact) {
        await handleLoadAndUntar();
      }
    })();
  }, [artifact]);
  useEffect(() => {
    if (untarredFiles.length != 0) {
      setSelectedFile(untarredFiles[0]);
    }
  }, [untarredFiles]);
  if (loading) {
    return (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
  }

  return artifact?.urls.large
    ? (
      <div className="w-3xl mx-auto px-4 py-8">
        <div className="mb-4 flex flex-col lg:flex-row lg:space-x-4">
          <div className="w-full">
            <div className="border border-gray-300 rounded-md overflow-hidden relative h-[600px]">
              <div className="h-full">
                {selectedFile
                  ? (
                    <FileRenderer
                      file={selectedFile}
                      allFiles={untarredFiles}
                    />
                  )
                  : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
    : (
      <div className="flex justify-center items-center pt-8">
        <Spinner />
      </div>
    );
};

interface IntroProps {
  onNext: () => void;
}

const Intro: React.FC<IntroProps> = ({ onNext }) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">
          Stompy Mini
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <img
          src={stompy}
          alt={"Stompy Robot"}
          className="max-w-full max-h-full object-contain mb-3"
        />
        <p>
          Thanks for getting started with our latest robot!<br />
          In the next few moments we'll get your robot assembled, calibrated,
          and ready to walk.
        </p>
      </CardContent>
      <CardFooter className="mt-2">
        <Button className="ml-auto" onClick={onNext}>
          Get Started <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

interface UnboxingProps {
  onNext: () => void;
}

const Unboxing: React.FC<UnboxingProps> = ({ onNext }) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">
          Unboxing
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <h4 className="my-2">Here's what you can expect to find in your box</h4>
        <Skeleton className="h-60 bg-gray-300 w-full" />
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Mechanical</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-2">
                <li>3D printed parts</li>
                <li>Screws</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Electrical</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-2">
                <li>IMU</li>
                <li>Camera</li>
                <li>Milk-V</li>
                <li>Flashed SD card</li>
                <li>Battery</li>
                <li>Servo Driver</li>
                <li>Servos</li>
                <li>Power Dropdown</li>
                <li>Cables</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="py-4">
        <Button className="ml-auto" variant="secondary">Back</Button>
        <Button onClick={onNext}>
          Assembly <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

interface AssemblyProps {
  onNext: () => void;
}

const Assembly: React.FC<AssemblyProps> = ({ onNext }) => {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">
          Assembly
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <h4 className="my-2">Let's get your robot assembled!</h4>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="step-1">
            <AccordionTrigger>Step 1: Mechanical Assembly</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Gather all 3D printed parts and screws.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Begin with the lower body: assemble the ankle, knee, and hip
                  joints.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Align and secure the 3D printed parts using screws at each
                  joint.
                </li>
                <li>Check for smooth joint movement before proceeding.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-2">
            <AccordionTrigger>Step 2: Installing Servos</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>
                  Attach servos to all major joints (e.g., hip, knee, shoulder).
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Refer to the labeled diagram for servo placement
                  (right_shoulder_pitch, left_hip_roll, etc.).
                </li>
                <li>Secure the servo arms using provided screws.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Ensure each servo is positioned at its neutral angle for
                  calibration.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-3">
            <AccordionTrigger>
              Step 3: Installing the IMU and Camera
            </AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Mount the IMU on the torso for orientation tracking.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Install the camera on the head to ensure the robot has a clear
                  field of vision.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Connect both components to the main control unit via
                  appropriate cables.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-4">
            <AccordionTrigger>Step 4: Setting up the Milk-V</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Flash the SD card with the correct firmware.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>Insert the flashed SD card into the Milk-V.</li>
                <li>
                  Mount the Milk-V securely inside the robot’s control
                  compartment.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-5">
            <AccordionTrigger>Step 5: Electrical Wiring</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Connect the battery to the power dropdown module.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Wire the servo driver to the servos following the correct
                  pinout diagram.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>Route the cables neatly to avoid tangling.</li>
                <li>Ensure all connections are secure and organized.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-6">
            <AccordionTrigger>Step 6: Power-On and Testing</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>
                  Turn on the power and ensure the robot receives power from the
                  battery.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Test each joint’s movement through the servo driver software.
                </li>
                <li>
                  Verify that the IMU and camera are functioning correctly.
                </li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Ensure the Milk-V boots up and runs the correct program.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-7">
            <AccordionTrigger>Step 7: Final Adjustments</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal pl-4">
                <li>Perform any necessary joint recalibration.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>Double-check all screws and wiring.</li>
                <Skeleton className="h-60 my-2 bg-gray-300 w-full" />
                <li>
                  Run a full movement test to ensure the robot operates as
                  expected.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="py-4">
        <Button className="ml-auto" variant="secondary">Back</Button>
        <Button onClick={onNext}>
          Connect to Robot <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

interface ConnectProps {
  onNext: () => void;
  updateRobotName: (string) => void;
}

const Connect: React.FC<ConnectProps> = ({ onNext, updateRobotName }) => {
  const [robotName, setRobotName] = useState("");
  const [isConnecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  function isIpAddress(input: string): boolean {
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6}))|(:((:[0-9a-fA-F]{1,4}){1,7}|:))|(::([fF]{4}:)?(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}))$/;

    return true;
    return ipv4Regex.test(input) || ipv6Regex.test(input) ||
      input == "localhost";
  }
  async function connectToRobot() {
    setConnecting(true);
    let server = "http://" + robotName;
    if (!isIpAddress(server)) {
      server = server + ".local";
    }
    server = server + ":50051";
    const robotConnection = new ServoControlClient(
      new GrpcWebFetchTransport({ baseUrl: server }),
    );
    updateRobotName(server);
    try {
      const { response } = await robotConnection.getPositions(hal_pb.Empty);
      console.log(response);
      onNext();
    } catch (error) {
      setError(error as string);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">
          Connect to Stompy
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <Skeleton className="h-60 bg-gray-300 w-full mb-4" />
        <p className="mb-4">
          Please ensure the robot is plugged in via the included USB-C and
          positioned on its stand.
        </p>
        <Input
          className="my-2"
          placeholder="stompy-robot-name"
          onChange={(e) => setRobotName(e.target.value)}
        />
        {error != ""
          ? (
            <Alert variant="destructive">
              <FaExclamationTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to connect to stompy. {error.toString()}
              </AlertDescription>
            </Alert>
          )
          : null}
      </CardContent>
      <CardFooter className="mt-2">
        <Button className="ml-auto" variant="secondary">Back</Button>
        <Button
          disabled={robotName == "" || isConnecting}
          onClick={connectToRobot}
        >
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
};

interface ServoLinkProps {
  robotUrl: string;
  onNext: () => void;
}

const ServoLink: React.FC<ServoLinkProps> = ({ onNext, robotUrl }) => {
  const servosAssigned = false;
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">
          Servo Linking
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-4">
        <p className="my-2">
          Select the servo to link, and click on the corresponding robot joint
          that moves on the robot
        </p>
        <Button className="mx-1" variant="selected" size="sm">
          <div>Servo 1</div>
        </Button>
        <Button className="mx-1" variant="outline" size="sm">
          <div>Servo 2</div>
        </Button>
        <Button className="mx-1" variant="outline" size="sm">
          <div>Servo 3</div>
        </Button>

        <RobotRenderer />
      </CardContent>
      <CardFooter className="mt-2">
        <Button disabled={servosAssigned} className="ml-auto" onClick={onNext}>
          Calibration <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

interface CalibrationProps {
  robotUrl: string;
  onNext: () => void;
}

const Calibration: React.FC<ServoLinkProps> = ({ onNext, robotUrl }) => {
  const servosAssigned = false;
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-xl">
          Calibrating Servos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Make sure your robot is placed on the holder, then we'll begin the
          calibration. If the movements on the robot aren't reflected on the
          viewer, please go back and make sure your servos are correctly
          assigned.
        </p>
        <RobotRenderer />
        <Button className="w-full my-2">
          Start Calibration
        </Button>

      </CardContent>
      <CardFooter className="mt-2">
        <Button variant="primary" disabled={servosAssigned} className="ml-auto" onClick={onNext}>
          Next Steps <FaChevronRight />
        </Button>
      </CardFooter>
    </Card>
  );
};

interface Step2Props {
  isConnected: boolean;
  onConnected: () => void;
  onNext: () => void;
}

const Step2: React.FC<Step2Props> = ({ isConnected, onConnected, onNext }) => {
  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      onConnected();
    }, 2000); // Simulate a 2-second delay for connection
    return () => clearTimeout(timer);
  }, [onConnected]);

  return (
    <div className="flex flex-col items-center justify-center">
      {isConnected
        ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Connected!</h1>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={onNext}
            >
              Start Calibration
            </button>
          </>
        )
        : (
          <>
            <h1 className="text-2xl font-bold mb-4">
              Connecting to the robot...
            </h1>
            <p className="mb-4">
              Please ensure the robot is plugged in via USB-C.
            </p>
            <img src="/robot_logo.png" alt="Robot Logo" className="w-32 h-32" />
          </>
        )}
    </div>
  );
};

interface Step3Props {
  servoIds: number[];
  onServoIdsLoaded: (ids: number[]) => void;
  onMappingComplete: (mapping: Record<string, number>) => void;
}

const Step3: React.FC<Step3Props> = (
  { servoIds, onServoIdsLoaded, onMappingComplete },
) => {
  const [servoIndex, setServoIndex] = useState(0);
  const [jointMapping, setJointMapping] = useState<Record<string, number>>({});

  // Load servo IDs if not loaded
  useEffect(() => {
    if (servoIds.length === 0) {
      getServos().then((ids) => onServoIdsLoaded(ids));
    }
  }, [servoIds, onServoIdsLoaded]);

  const currentServoId = servoIds[servoIndex];

  // Wiggle current servo
  useEffect(() => {
    if (currentServoId) {
      wiggleServo(currentServoId);
    }
  }, [currentServoId]);

  // Initialize Three.js scene

  const handleJointClick = (jointName: string) => {
    setJointMapping((prevMapping) => ({
      ...prevMapping,
      [jointName]: currentServoId,
    }));
    setServoIndex(servoIndex + 1);
  };

  // Check if mapping is complete
  useEffect(() => {
    if (servoIndex >= servoIds.length && servoIds.length > 0) {
      onMappingComplete(jointMapping);
    }
  }, [servoIndex, servoIds.length, jointMapping, onMappingComplete]);

  return (
    <div className="flex flex-col items-center justify-center relative">
      <h1 className="text-2xl font-bold mb-4">Servo Calibration</h1>
      <p className="mb-4">
        Servo {currentServoId}{" "}
        is wiggling. Please click on the corresponding joint.
      </p>
      <RobotRenderer />
    </div>
  );
};

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [servoIds, setServoIds] = useState<number[]>([]);
  const [jointMapping, setJointMapping] = useState<Record<string, number>>({});
  const [robotName, setRobotName] = useState("");

  const nextStep = () => setStep((prevStep) => prevStep + 1);
  const prevStep = () => setStep((prevStep) => prevStep - 1);

  const handleServoIdsLoaded = (ids: number[]) => {
    setServoIds(ids);
  };

  const handleMappingComplete = (mapping: Record<string, number>) => {
    setJointMapping(mapping);

    // Change servo IDs based on standard mapping
    const standardMapping = {
      [JointEnum.RIGHT_SHOULDER_PITCH]: 1,
      [JointEnum.LEFT_SHOULDER_PITCH]: 2,
      // Add other standard mappings
    };

    // Update servo IDs
    Object.entries(mapping).forEach(([joint, oldId]) => {
      const newId = standardMapping[joint as JointEnum];
      if (newId !== undefined && newId !== oldId) {
        changeServoId(oldId, newId);
      }
    });

    nextStep();
  };

  const handleStartCalibration = () => {
    startCalibration();
    nextStep();
  };

  const handleCalibrationComplete = () => {
    nextStep();
  };

  const handleCancelCalibration = () => {
    cancelCalibration();
    setStep(4); // Go back to the calibration confirmation step
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <Intro onNext={nextStep} />;
      case 2:
        return <Unboxing onNext={nextStep} />;
      case 3:
        return <Assembly onNext={nextStep} />;
      case 4:
        return (
          <Connect
            onNext={nextStep}
            updateRobotName={(name: string) => {
              setRobotName(name);
            }}
          />
        );
      case 5:
        return (
          <ServoLink
            onNext={nextStep}
            robotUrl={robotName}
          />
        );
      case 6:
        return (
          <Calibration
            onNext={nextStep}
            robotUrl={robotName}
          />
        );
      /*
        return (
          <Step2
            isConnected={isConnected}
            onConnected={() => setIsConnected(true)}
            onNext={nextStep}
          />
        );
      case 3:
        return (
          <Step3
            servoIds={servoIds}
            onServoIdsLoaded={handleServoIdsLoaded}
            onMappingComplete={handleMappingComplete}
          />
        );
        /*
      case 4:
        return <Step4 onStartCalibration={handleStartCalibration} />;
      case 5:
        return (
          <Step5
            onCalibrationComplete={handleCalibrationComplete}
            onCancelCalibration={handleCancelCalibration}
          />
        );
      case 6:
        return <Step6 />;
        */
      default:
        return null;
    }
  };

  return (
    <div className="relative flex justify-center">
      <div className="max-w-5xl py-4 flex-grow">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default Onboarding;
