package com.clawket.appicon

import android.content.ComponentName
import android.content.Context
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val DEFAULT_ICON = "default"
private const val BLACK_ICON = "black"
private const val DEFAULT_ALIAS_SUFFIX = ".MainActivityDefault"
private const val BLACK_ALIAS_SUFFIX = ".MainActivityBlack"

class InvalidAppIconException(icon: String) :
  CodedException(message = "Unsupported app icon '$icon'.")

class MissingAppIconAliasException(aliasName: String, cause: Throwable) :
  CodedException(message = "Unable to inspect app icon alias '$aliasName'.", cause = cause)

class ClawketAppIconModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ClawketAppIcon")

    AsyncFunction<Boolean>("isSupportedAsync") {
      true
    }

    AsyncFunction<String>("getCurrentIconAsync") {
      if (isAliasEnabled(blackAliasComponentName)) {
        BLACK_ICON
      } else {
        DEFAULT_ICON
      }
    }

    AsyncFunction("setIconAsync") { icon: String ->
      when (icon) {
        DEFAULT_ICON -> {
          setAliasEnabled(defaultAliasComponentName, true)
          setAliasEnabled(blackAliasComponentName, false)
        }
        BLACK_ICON -> {
          setAliasEnabled(blackAliasComponentName, true)
          setAliasEnabled(defaultAliasComponentName, false)
        }
        else -> throw InvalidAppIconException(icon)
      }
    }
  }

  private val defaultAliasComponentName: ComponentName
    get() = ComponentName(context.packageName, context.packageName + DEFAULT_ALIAS_SUFFIX)

  private val blackAliasComponentName: ComponentName
    get() = ComponentName(context.packageName, context.packageName + BLACK_ALIAS_SUFFIX)

  private fun isAliasEnabled(componentName: ComponentName): Boolean {
    return try {
      context.packageManager.getActivityInfoCompat(componentName).enabled
    } catch (error: PackageManager.NameNotFoundException) {
      throw MissingAppIconAliasException(componentName.className, error)
    }
  }

  private fun setAliasEnabled(componentName: ComponentName, enabled: Boolean) {
    context.packageManager.setComponentEnabledSetting(
      componentName,
      if (enabled) PackageManager.COMPONENT_ENABLED_STATE_ENABLED else PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
      PackageManager.DONT_KILL_APP
    )
  }
}

private fun PackageManager.getActivityInfoCompat(componentName: ComponentName): ActivityInfo {
  return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    getActivityInfo(componentName, PackageManager.ComponentInfoFlags.of(0))
  } else {
    @Suppress("DEPRECATION")
    getActivityInfo(componentName, 0)
  }
}
