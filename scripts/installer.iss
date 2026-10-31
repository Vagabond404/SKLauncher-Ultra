; Inno Setup 6 Script for SKLauncher Ultra
; Fully in English, modern wizard style with LZMA2 solid compression

#define MyAppName "SKLauncher Ultra"
#define MyAppVersion "4.0.55-Ultra"
#define MyAppPublisher "Vagabond404"
#define MyAppURL "https://github.com/Vagabond404/SKLauncher-Ultra"
#define MyAppExeName "sklauncher.exe"

[Setup]
AppId={{5E7A2E3B-8C49-4D2A-98F1-4F2A1234ABCD}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/issues
AppUpdatesURL={#MyAppURL}/releases
DefaultDirName={localappdata}\Programs\sklauncher
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=C:\Users\ange-\.gemini\antigravity-cli\brain\11cb9d0e-819e-4e39-a95a-3a37e7afc97a\scratch
OutputBaseFilename=SKLauncher-Ultra-Setup
SetupIconFile=C:\Users\ange-\.gemini\antigravity-cli\brain\11cb9d0e-819e-4e39-a95a-3a37e7afc97a\scratch\sklauncher-4.0-source\resources\icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
Source: "C:\Users\ange-\.gemini\antigravity-cli\brain\11cb9d0e-819e-4e39-a95a-3a37e7afc97a\scratch\installer-build\sklauncher\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
// Close any running instances of SKLauncher before installation
function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
begin
  ShellExec('open', 'taskkill.exe', '/F /IM sklauncher.exe /T', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
  Result := True;
end;
