<template>
  <ion-page class="w-full h-full">
    <ion-header>
      <ion-toolbar>
        <ion-title>Secure storage</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :scroll-y="true">
      <div
        class="flex flex-col justify-start items-center w-full ion-padding-top pr-5"
      >
        <ion-item
          v-if="Capacitor.getPlatform() === 'web'"
          lines="inset"
          class="w-full"
        >
          <ion-label class="flex-initial">Storage:</ion-label>
          <ion-select
            v-model="storageType"
            interface="action-sheet"
            :interface-options="{ header: 'Select storage type' }"
            class="flex-initial max-w-full [--padding-start:0]"
          >
            <ion-select-option value="sessionStorage">
              sessionStorage
            </ion-select-option>

            <ion-select-option value="localStorage">
              localStorage
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item
          v-if="Capacitor.getPlatform() === 'ios'"
          lines="inset"
          class="w-full"
        >
          <ion-checkbox
            v-model="iCloudSync"
            @ion-change="onSetSync"
          />
          <ion-label>iCloud sync</ion-label>
        </ion-item>

        <div class="flex items-end w-full">
          <ion-item
            lines="inset"
            class="w-full"
          >
            <ion-label>Prefix:</ion-label>
            <ion-input
              v-model="prefix"
              type="text"
              class="flex-1"
            />
          </ion-item>

          <ion-button
            size="small"
            class="flex-initial"
            @click="onSetPrefix"
          >
            Set
          </ion-button>
        </div>

        <div class="flex w-full">
          <ion-item
            lines="inset"
            class="flex-1"
          >
            <ion-label>Key:</ion-label>
            <ion-input
              v-model="key"
              type="text"
              required
            />
          </ion-item>
          <ion-item
            v-if="Capacitor.getPlatform() === 'ios'"
            lines="none"
          >
            <ion-checkbox
              v-model="syncItem"
              :indeterminate="useGlobalSync"
              @click="onSyncItemClick"
            />
            <ion-label>Sync</ion-label>
          </ion-item>
        </div>

        <ion-item
          lines="inset"
          class="w-full"
        >
          <ion-label>Data:</ion-label>
          <ion-input
            v-model="data"
            required
            @ion-change="onDataChanged"
          />
        </ion-item>
      </div>

      <ion-item
        lines="none"
        class="text-sm"
      >
        {{ dataType || '&nbsp;' }}
      </ion-item>

      <ion-item
        lines="none"
        class="flex items-center w-full pt-6 space-x-5"
      >
        <ion-text>Item:</ion-text>
        <ion-button
          size="default"
          @click="onSet"
        >
          Set
        </ion-button>
        <ion-button
          size="default"
          @click="onGet"
        >
          Get
        </ion-button>
        <ion-button
          size="default"
          @click="onRemove"
        >
          Remove
        </ion-button>
      </ion-item>

      <ion-item
        lines="none"
        class="flex justify-center items-center w-full mt-4 space-x-5"
      >
        <ion-text>Global:</ion-text>
        <ion-button
          size="default"
          @click="onClear"
        >
          Clear
        </ion-button>
        <ion-button
          size="default"
          @click="onShowKeys"
        >
          Keys
        </ion-button>
      </ion-item>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import type {
  DataType,
  StorageError
} from '@aparajita/capacitor-secure-storage'
import { SecureStorage, StorageType } from '@aparajita/capacitor-secure-storage'
import { Capacitor } from '@capacitor/core'
import type { InputChangeEventDetail, IonInputCustomEvent } from '@ionic/core'
import {
  alertController,
  IonButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/vue'
import { onBeforeMount, ref, watch } from 'vue'

/*
 * ref
 */
const key = ref('')
const data = ref('')
const dataType = ref('')
const storageType = ref(StorageType[StorageType.localStorage])
const prefix = ref('')
const iCloudSync = ref(false)
const syncItem = ref(false)
const useGlobalSync = ref(true)

/*
 * watch
 */
watch(storageType, () => {
  onChangeStorageType()
})

/*
 * lifecycle
 */
onBeforeMount(async () => {
  prefix.value = await SecureStorage.getKeyPrefix()

  // This stuff pertains only to the web
  if (Capacitor.getPlatform() === 'web') {
    let encryptionKey = import.meta.env.VITE_SECURE_STORAGE_ENCRYPTION_KEY

    if (!encryptionKey) {
      console.warn(
        'The encryption key should be set by the environment variable VITE_SECURE_STORAGE_ENCRYPTION_KEY or by calling setEncryptionKey()'
      )
      encryptionKey = 'This is just a placeholder'
    }

    await SecureStorage.setEncryptionKey(encryptionKey)
  }
})

/*
 * methods
 */
async function onChangeStorageType(): Promise<void> {
  await SecureStorage.setStorageType(
    storageType.value === 'sessionStorage'
      ? StorageType.sessionStorage
      : StorageType.localStorage
  )
}

async function onSetSync(): Promise<void> {
  await SecureStorage.setSynchronize(iCloudSync.value)
}

function onSyncItemClick(): void {
  // We can't change the checkbox state synchronously, do it after the click
  setTimeout(() => {
    // The value of syncItem is BEFORE it is changed.
    // We want to cycle between checked, unchecked, and indeterminate.
    if (useGlobalSync.value) {
      // was indeterminate => checked
      syncItem.value = true
      useGlobalSync.value = false
    } else if (syncItem.value) {
      // was unchecked => indeterminate
      useGlobalSync.value = true
    } else {
      // was checked => unchecked
    }
  }, 0)
}

function onDataChanged(
  event: IonInputCustomEvent<InputChangeEventDetail>
): void {
  try {
    // eslint-disable-next-line
    const [_, type] = parseValue(event.detail.value || '')
    dataType.value = type
  } catch (e) {
    dataType.value = ''
  }
}

function synchronize(): boolean {
  return useGlobalSync.value ? iCloudSync.value : syncItem.value
}

async function onSet(): Promise<void> {
  try {
    const [value, type] = parseValue(data.value)
    await SecureStorage.set(key.value, value, true, synchronize())
    await showAlert(`Item (${type}) stored successfully.`)
    data.value = ''
    dataType.value = ''
  } catch (e) {
    await showErrorAlert(e)
  }
}

function parseValue(value: string): [DataType, string] {
  if (!value) {
    throw new SyntaxError('Empty data value')
  }

  if (/^\d{4}-\d{2}-\d{2}/u.test(value)) {
    const date = new Date(value)

    // If the format is not a valid date, the properties will be NaN
    if (!Number.isNaN(date.getFullYear())) {
      return [date, 'date']
    }
  }

  const parsed = JSON.parse(value)
  let type: string = typeof parsed

  if (type === 'object') {
    if (parsed === null) {
      type = 'null'
    } else if (Array.isArray(parsed)) {
      type = 'array'
    }
  }

  return [parsed, type]
}

function getDataType(value: DataType): string {
  const type = typeof value

  if (type === 'object') {
    if (value === null) {
      return 'null'
    }

    if (value instanceof Date) {
      return 'date'
    }

    if (Array.isArray(value)) {
      return 'array'
    }

    return 'object'
  }

  return type
}

async function onGet(): Promise<void> {
  try {
    const value = await SecureStorage.get(key.value, true, synchronize())

    if (value instanceof Date) {
      data.value = value.toISOString()
    } else {
      data.value = JSON.stringify(value)
    }

    dataType.value = getDataType(value)
  } catch (e) {
    data.value = ''
    await showErrorAlert(e)
  }
}

async function onRemove(): Promise<void> {
  try {
    const success = await SecureStorage.remove(key.value, synchronize())

    if (success) {
      await showAlert(`Item for key "${key.value}" removed successfully.`)
    } else {
      await showAlert(`There is no item with the key "${key.value}".`)
    }
  } catch (e) {
    await showErrorAlert(e)
  } finally {
    data.value = ''
  }
}

async function onClear(): Promise<void> {
  try {
    await SecureStorage.clear(synchronize())
    key.value = ''
    await showAlert(
      `All items with prefix '${await SecureStorage.getKeyPrefix()}' removed.`
    )
  } catch (e) {
    await showErrorAlert(e)
  } finally {
    data.value = ''
  }
}

async function onSetPrefix(): Promise<void> {
  await SecureStorage.setKeyPrefix(prefix.value)
  await showAlert(`Prefix set to "${prefix.value}".`)
}

async function onShowKeys(): Promise<void> {
  const keys = await SecureStorage.keys(synchronize())
  keys.sort()

  let qty: string

  switch (keys.length) {
    case 0:
      qty = 'are no'
      break

    case 1:
      qty = 'is 1'
      break

    default:
      qty = `are ${keys.length}`
  }

  let msg = `There ${qty} key${keys.length === 1 ? '' : 's'} with the prefix '${
    prefix.value
  }'.`

  if (keys.length > 0) {
    msg += `<br><br>${keys.join('<br>')}`
  }

  await showAlert(msg)
}

function isStorageError(error: Error): error is StorageError {
  // eslint-disable-next-line no-prototype-builtins
  return error.hasOwnProperty('code')
}

async function showErrorAlert(error: unknown): Promise<void> {
  let message: string

  if (error instanceof Error) {
    message = error.message

    if (isStorageError(error)) {
      message += ` [${error.code}]`
    }
  } else {
    message = String(error)
  }

  await showAlert(`${message}.`)
}

async function showAlert(message: string): Promise<void> {
  const alert = await alertController.create({
    header: `The plugin says:`,
    subHeader: '',
    message,
    buttons: ['OK']
  })
  await alert.present()
}
</script>
