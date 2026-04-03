import ExpoModulesCore
import UIKit

public final class ClawketAppIconModule: Module {
  private let blackIconName = "AppIconBlack"

  public func definition() -> ModuleDefinition {
    Name("ClawketAppIcon")

    AsyncFunction("isSupportedAsync") {
      UIApplication.shared.supportsAlternateIcons
    }.runOnQueue(.main)

    AsyncFunction("getCurrentIconAsync") {
      let application = UIApplication.shared
      guard application.supportsAlternateIcons else {
        return "default"
      }
      return self.normalizeIconName(application.alternateIconName)
    }.runOnQueue(.main)

    AsyncFunction("setIconAsync") { (icon: String, promise: Promise) in
      let application = UIApplication.shared
      guard application.supportsAlternateIcons else {
        promise.reject("ERR_APP_ICON_UNSUPPORTED", "Changing the app icon is unavailable on this device.")
        return
      }

      let alternateIconName: String?
      do {
        alternateIconName = try self.resolveAlternateIconName(icon)
      } catch let error as AppIconException {
        promise.reject(error.code, error.localizedDescription)
        return
      } catch {
        promise.reject("ERR_APP_ICON_UNKNOWN", error.localizedDescription)
        return
      }

      if application.alternateIconName == alternateIconName {
        promise.resolve(nil)
        return
      }

      application.setAlternateIconName(alternateIconName) { error in
        if let error {
          promise.reject("ERR_APP_ICON_SET_FAILED", error.localizedDescription)
          return
        }
        promise.resolve(nil)
      }
    }.runOnQueue(.main)
  }

  private func normalizeIconName(_ iconName: String?) -> String {
    switch iconName {
    case nil:
      return "default"
    case blackIconName:
      return "black"
    default:
      return "default"
    }
  }

  private func resolveAlternateIconName(_ icon: String) throws -> String? {
    switch icon {
    case "default":
      return nil
    case "black":
      return blackIconName
    default:
      throw AppIconException.invalidIcon(icon)
    }
  }
}

private enum AppIconException: LocalizedError {
  case invalidIcon(String)

  var code: String {
    switch self {
    case .invalidIcon:
      return "ERR_APP_ICON_INVALID"
    }
  }

  var errorDescription: String? {
    switch self {
    case .invalidIcon(let icon):
      return "Unsupported app icon '\(icon)'."
    }
  }
}
